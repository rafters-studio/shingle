#!/usr/bin/env bash
# Captures the output blocks of the smugglr manual and of the home page's
# summary band from one run of a smugglr release binary. Each block lands in
# <out dir>/<name>.txt exactly as a page prints it: the "$ command" lines, then
# what the binary wrote (stdout and stderr). Nothing is typed.
#
# Every scenario runs in its own directory with its own config directory, and
# the command shown is the command that ran.
#
# Usage:  capture-manual.sh <dir holding smugglr> <empty scratch dir> <out dir>
# Then:   node scripts/blocks-to-json.mjs <out dir> src/smugglr/manual-output.json
set -u
BIN="$1"; W="$2"; OUT="$3"
mkdir -p "$OUT" "$W"
W="$(cd "$W" && pwd)"; OUT="$(cd "$OUT" && pwd)"
export PATH="$BIN:$PATH" HOME="$W/home"
mkdir -p "$HOME"

CUR=""; RC=0
begin() { CUR="$OUT/$1.txt"; : > "$CUR"; }
# run <command>: print "$ command", run it, keep its exit status in RC.
run() { printf '$ %s\n' "$1" >> "$CUR"; sh -c "$1" >> "$CUR" 2>&1; RC=$?; }
# status: print "$ echo $?" and the exit status of the last run.
status() { printf '$ echo $?\n%s\n' "$RC" >> "$CUR"; }
# quiet <command>: set the scene without it being a block.
quiet() { sh -c "$1" >/dev/null 2>&1; }
scene() { SCENE="$W/$1"; mkdir -p "$SCENE"; cd "$SCENE" || exit 1; export XDG_CONFIG_HOME="$SCENE/config"; mkdir -p "$XDG_CONFIG_HOME/smugglr"; }
mkshop() { sqlite3 "$1" "create table products (sku text primary key, name text not null, price integer not null);"; }
SEED="insert into products values ('sku-0107','kettle',2400),('sku-0233','mug',800),('sku-0412','teapot',3100);"

# ---- shop: a first sync, edits that cross, then a conflict
scene shop; mkdir laptop server; mkshop laptop/shop.db; mkshop server/shop.db
sqlite3 laptop/shop.db "$SEED"
begin first_dry; run 'smugglr sync laptop/shop.db server/shop.db --dryrun'
begin first_run; run 'smugglr sync laptop/shop.db server/shop.db'; status
begin in_step;   run 'smugglr sync laptop/shop.db server/shop.db'
sqlite3 laptop/shop.db "update products set price=2600 where sku='sku-0107'; delete from products where sku='sku-0233';"
sqlite3 server/shop.db "insert into products values ('sku-0500','tray',1500);"
begin moved_dry;     run 'smugglr sync laptop/shop.db server/shop.db --dryrun'
begin moved_json;    run 'smugglr sync laptop/shop.db server/shop.db --json'
begin moved_in_step; run 'smugglr sync laptop/shop.db server/shop.db'
sqlite3 laptop/shop.db "update products set price=3300 where sku='sku-0412';"
sqlite3 server/shop.db "update products set price=3200 where sku='sku-0412';"
begin stop;         run 'smugglr sync laptop/shop.db server/shop.db'; status
begin stop_json;    run 'smugglr sync laptop/shop.db server/shop.db --json'
begin unknown_type; run 'smugglr sync laptop/shop.db server/shop.db --sync-type hub 2>&1 | head -1'
begin watch_zero;   run 'smugglr sync laptop/shop.db server/shop.db --watch 0 2>&1 | head -1'
begin d1_missing;   run 'smugglr sync laptop/shop.db d1://shop 2>&1 | head -1'
begin source_dry;   run 'smugglr sync laptop/shop.db server/shop.db --sync-mode source --dryrun'
begin source_run;   run 'smugglr sync laptop/shop.db server/shop.db --sync-mode source'

# ---- partial: one table moves, another stops
scene partial; mkdir a b
for d in a b; do mkshop $d/shop.db; sqlite3 $d/shop.db "create table orders (id text primary key, sku text not null);"; done
sqlite3 a/shop.db "$SEED insert into orders values ('o1','sku-0107');"
quiet 'smugglr sync a/shop.db b/shop.db'
sqlite3 a/shop.db "update products set price=3300 where sku='sku-0412'; insert into orders values ('o2','sku-0233');"
sqlite3 b/shop.db "update products set price=3200 where sku='sku-0412';"
begin partial; run 'smugglr sync a/shop.db b/shop.db'; status

# ---- steering: a table with an updated_at column
scene steer; mkdir laptop server
for d in laptop server; do sqlite3 $d/shop.db "create table products (sku text primary key, name text not null, price integer not null, updated_at integer not null);"; done
sqlite3 laptop/shop.db "insert into products values ('sku-0107','kettle',2400,100),('sku-0412','teapot',3100,100);"
quiet 'smugglr sync laptop/shop.db server/shop.db'
sqlite3 laptop/shop.db "update products set price=3300, updated_at=300 where sku='sku-0412';"
sqlite3 server/shop.db "update products set price=3200, updated_at=200 where sku='sku-0412';"
begin last_nosteer; run 'smugglr sync laptop/shop.db server/shop.db --sync-mode last | head -1'
printf 'steering = "updated_at"\n' > "$XDG_CONFIG_HOME/smugglr/config.toml"
begin last_dry; run 'smugglr sync laptop/shop.db server/shop.db --sync-mode last --dryrun'
begin last_run; run 'smugglr sync laptop/shop.db server/shop.db --sync-mode last'

# ---- shapes: audit has a column the other place lacks
scene shape; mkdir laptop server
for d in laptop server; do mkshop $d/shop.db; sqlite3 $d/shop.db "create table audit (id text primary key);"; done
sqlite3 laptop/shop.db "$SEED"
quiet 'smugglr sync laptop/shop.db server/shop.db'
sqlite3 laptop/shop.db "alter table audit add column who text;"
begin shape;       run 'smugglr sync laptop/shop.db server/shop.db'; status
begin shape_json;  run 'smugglr sync laptop/shop.db server/shop.db --json'
begin shape_table; run 'smugglr sync laptop/shop.db server/shop.db --table products'
printf 'ignore = ["audit"]\n' > "$XDG_CONFIG_HOME/smugglr/config.toml"
begin ignored; run 'smugglr sync laptop/shop.db server/shop.db'

# ---- too much: max_wire trips on two small rows
scene wire; mkdir laptop server; mkshop laptop/shop.db; mkshop server/shop.db
sqlite3 laptop/shop.db "insert into products values ('sku-0107','kettle',2400),('sku-0233','mug',800);"
printf 'max_wire = "10 B"\n' > "$XDG_CONFIG_HOME/smugglr/config.toml"
begin too_much; run 'smugglr sync ./laptop/shop.db ./server/shop.db | sed "s#$PWD#.#g"'

# ---- stash and retrieve
scene stash; mkdir a b; mkshop a/shop.db; mkshop b/shop.db
sqlite3 a/shop.db "$SEED"
openssl rand -hex 32 > shop.key
begin stash;    run 'smugglr stash a/shop.db blobs --key-file shop.key --node laptop --whole'
begin retrieve; run 'smugglr retrieve b/shop.db blobs --key-file shop.key --node phone'; status
begin retrieve_again;     run 'smugglr retrieve b/shop.db blobs --key-file shop.key --node phone'
begin sync_after_retrieve; run 'smugglr sync a/shop.db b/shop.db'

# ---- a change dropped inside the graveyard window, then replayed
scene drop; mkdir a b
for d in a b; do sqlite3 $d/shop.db "create table notes (id text primary key, body text not null);"; done
openssl rand -hex 32 > shop.key
sqlite3 a/shop.db "insert into notes values ('n1','first note');"
quiet 'smugglr stash a/shop.db blobs --key-file shop.key --node laptop --whole'
quiet 'smugglr retrieve b/shop.db blobs --key-file shop.key --node phone'
sqlite3 a/shop.db "delete from notes where id='n1';"
quiet 'smugglr stash a/shop.db blobs --key-file shop.key --node laptop'
quiet 'smugglr retrieve b/shop.db blobs --key-file shop.key --node phone'
sqlite3 a/shop.db "insert into notes values ('n1','back again');"
BLOB=$(smugglr stash a/shop.db blobs --key-file shop.key --node laptop 2>&1 | tail -1)
begin retrieve_drop; run "smugglr retrieve b/shop.db $BLOB --key-file shop.key --node phone"
HASH=$(grep -o 'change [0-9a-f]\{64\}' "$CUR" | head -1 | cut -d' ' -f2)
begin retrieve_replay; run "smugglr retrieve b/shop.db --key-file shop.key --node phone --replay $HASH"; status

# ---- discover, exec and the version
scene discover; mkdir laptop server
for d in laptop server; do mkshop $d/shop.db; done
sqlite3 laptop/shop.db "$SEED"
begin version;  run 'smugglr --version'
begin discover; run 'smugglr sync laptop/shop.db server/shop.db --discover'; status
sqlite3 laptop/shop.db "create table audit (id text primary key, who text);"
sqlite3 server/shop.db "create table audit (id text primary key);"
begin discover_stop; run 'smugglr sync laptop/shop.db server/shop.db --discover'; status
begin exec_read; run 'smugglr exec laptop/shop.db --read'
sed -i.bak "s#$SCENE#.#g" "$OUT/discover.txt" "$OUT/discover_stop.txt" "$OUT/exec_read.txt" && rm -f "$OUT"/discover*.bak "$OUT"/exec_read.txt.bak

# ---- the mesh: two nodes on one machine, each with its own port and a
# hostname shim, naming each other in `peers`
scene mesh
mkdir -p puck/shim rzr/shim
smugglr mesh keygen --key-file ./mesh.key > keygen.out 2>&1
begin mesh_keygen; printf '$ smugglr mesh keygen --key-file ./mesh.key\n' >> "$CUR"; cat keygen.out >> "$CUR"
cp mesh.key loose.key; chmod 644 loose.key
begin mesh_loose; run 'chmod 644 ./loose.key'; run 'smugglr mesh ./puck/node.db --key-file ./loose.key'; status
rm -f loose.key
for n in puck rzr; do
  printf '#!/bin/sh\necho %s\n' "$n" > "$n/shim/hostname"; chmod +x "$n/shim/hostname"
  sqlite3 "$n/node.db" "create table notes (id text primary key, body text not null);"
  mkdir -p "$n/config/smugglr"
done
printf 'port = 31401\npeers = ["127.0.0.1:31402"]\n' > puck/config/smugglr/config.toml
printf 'port = 31402\npeers = ["127.0.0.1:31401"]\ngraveyard = 3\n' > rzr/config/smugglr/config.toml
start() { # start <node> <log>
  ( cd "$SCENE/$1" && PATH="$SCENE/$1/shim:$PATH" XDG_CONFIG_HOME="$SCENE/$1/config" HOME="$SCENE/$1" \
      exec smugglr mesh ./node.db --key-file ../mesh.key > "$SCENE/$1/$2" 2>&1 ) &
  echo $!
}
PUCK=$(start puck out.log); RZR=$(start rzr out.log)
sleep 3
begin mesh_start
printf '$ smugglr mesh ./node.db --key-file ../mesh.key   # on puck\n' >> "$CUR"; head -1 puck/out.log >> "$CUR"
printf '$ smugglr mesh ./node.db --key-file ../mesh.key   # on rzr\n' >> "$CUR"; head -1 rzr/out.log >> "$CUR"

(cd puck && sqlite3 ./node.db "insert into notes values('n1','first note');"); sleep 4
begin mesh_insert
printf '$ sqlite3 ./node.db "insert into notes values('"'"'n1'"'"','"'"'first note'"'"');"   # on puck\n' >> "$CUR"
printf '$ sqlite3 ./node.db "select * from notes"   # on rzr\n' >> "$CUR"
(cd rzr && sqlite3 ./node.db "select * from notes") >> "$CUR"
printf '# rzr, output so far\n' >> "$CUR"; cat rzr/out.log >> "$CUR"

(cd puck && sqlite3 ./node.db "delete from notes where id='n1'"); sleep 4
begin mesh_delete
printf '$ sqlite3 ./node.db "delete from notes where id='"'"'n1'"'"'"   # on puck\n' >> "$CUR"
printf '$ sqlite3 ./node.db "select count(*) from notes"   # on rzr\n' >> "$CUR"
(cd rzr && sqlite3 ./node.db "select count(*) from notes") >> "$CUR"
printf '# rzr, output so far\n' >> "$CUR"; cat rzr/out.log >> "$CUR"

(cd puck && sqlite3 ./node.db "insert into notes values('n1','back again');"); sleep 4
begin mesh_dropped
printf '$ sqlite3 ./node.db "insert into notes values('"'"'n1'"'"','"'"'back again'"'"');"   # on puck, after the delete above\n' >> "$CUR"
printf '$ sqlite3 ./node.db "select count(*) from notes"   # on rzr\n' >> "$CUR"
(cd rzr && sqlite3 ./node.db "select count(*) from notes") >> "$CUR"
printf '# rzr, output so far\n' >> "$CUR"; cat rzr/out.log >> "$CUR"
MHASH=$(grep -o 'change [0-9a-f]\{64\}' rzr/out.log | head -1 | cut -d' ' -f2)

(cd puck && sqlite3 ./node.db "insert into notes values('big', replace(hex(zeroblob(15000)),'0','x'));"); sleep 15
begin mesh_parts
printf '$ sqlite3 ./node.db "insert into notes values('"'"'big'"'"', <30,000 characters>);"   # on puck\n' >> "$CUR"
printf '$ sqlite3 ./node.db "select id, length(body) from notes where id='"'"'big'"'"'"   # on rzr\n' >> "$CUR"
(cd rzr && sqlite3 ./node.db "select id, length(body) from notes where id='big'") >> "$CUR"
printf '# rzr, last line of output\n' >> "$CUR"; tail -1 rzr/out.log >> "$CUR"

kill "$RZR" 2>/dev/null; wait "$RZR" 2>/dev/null
rm -f rzr/out.log
(cd rzr && PATH="$SCENE/rzr/shim:$PATH" XDG_CONFIG_HOME="$SCENE/rzr/config" HOME="$SCENE/rzr" \
  smugglr mesh ./node.db --key-file ../mesh.key --replay "$MHASH" > replay.out 2>&1; echo $? > replay.rc)
begin mesh_replay
printf '$ smugglr mesh ./node.db --key-file ../mesh.key --replay %s   # on rzr\n' "$MHASH" >> "$CUR"; cat rzr/replay.out >> "$CUR"
printf '$ echo $?\n%s\n' "$(cat rzr/replay.rc)" >> "$CUR"
printf '$ sqlite3 ./node.db "select * from notes"   # on rzr\n' >> "$CUR"
(cd rzr && sqlite3 ./node.db "select * from notes where id='n1'") >> "$CUR"

sleep 5
RZR=$(start rzr away.log); sleep 4
begin mesh_away
printf '$ smugglr mesh ./node.db --key-file ../mesh.key   # on rzr, restarted after being stopped longer than its graveyard (3 seconds); the scratch directory is shown as .\n' >> "$CUR"
sed -e "s#$SCENE/rzr#.#g" -e "s#$SCENE#.#g" rzr/away.log >> "$CUR"
kill "$PUCK" "$RZR" 2>/dev/null; wait 2>/dev/null
echo "captured: $(ls "$OUT" | wc -l) blocks"
