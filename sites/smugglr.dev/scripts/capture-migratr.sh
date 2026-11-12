#!/usr/bin/env bash
# Captures the output blocks of the /migratr/ page's agent record from one run
# of a migratr release binary, into <out dir>/<name>.txt, one block each, in
# the order the page shows them. Nothing is typed; the scratch directory prints
# as a dot. checksums.txt is the release's own file, fetched by the caller.
#
# Usage:  capture-migratr.sh <dir holding migratr> <empty scratch dir> <out dir> <checksums.txt>
# Then:   node scripts/blocks-to-json.mjs <out dir> src/migratr/runs.json
set -u
BIN="$1"; W="$2"; OUT="$3"; CHECKSUMS="$4"
mkdir -p "$OUT" "$W"
W="$(cd "$W" && pwd)"; OUT="$(cd "$OUT" && pwd)"
export PATH="$BIN:$PATH"
cd "$W" || exit 1
# migratr 0.3 is loud by default: it writes its settings, and each statement a
# run executes, to stderr. The page's blocks are the runs with that turned off.
printf '{ "loud": false }\n' > migratr.jsonc

CUR=""; RC=0
begin() { CUR="$OUT/$1.txt"; : > "$CUR"; }
run() { printf '$ %s\n' "$1" >> "$CUR"; sh -c "$1" >> "$CUR" 2>&1; RC=$?; }
status() { printf '$ echo $?\n%s\n' "$RC" >> "$CUR"; }
quiet() { sh -c "$1" >/dev/null 2>&1; }
tick() { sleep 1; }

begin checksums; printf '$ cat checksums.txt\n' >> "$CUR"; cp "$CHECKSUMS" checksums.txt; cat checksums.txt >> "$CUR"
begin version;   run 'migratr --version'

begin new_users; run 'migratr new create_users id:integer:pk name:text:notnull handle:text:unique'; tick
begin new_posts; run 'migratr new create_posts id:integer:pk author_id:integer title:text:notnull'
begin plan_first; run 'migratr --db app.db plan'
begin up_first;   run 'migratr --db app.db up --json'
sqlite3 app.db "insert into users (id, name, handle) values (1,'Ada','ada'),(2,'Brian','brian'),(3,'Cleo','cleo'); insert into posts (id, author_id, title) values (1,1,'hello'),(2,1,'again'),(3,2,'notes'),(4,9,'stray');"
begin rows_before; run 'sqlite3 app.db "select * from users; select * from posts;"'

tick; quiet 'migratr new link_posts_to_users'
KEY=$(ls migrations | grep link_posts_to_users)
cat > "migrations/$KEY" <<'JSON'
{
  "up": [
    {
      "op": "add_foreign_key",
      "table": "posts",
      "columns": ["author_id"],
      "references": { "table": "users", "columns": ["id"] },
      "on_delete": "CASCADE",
      "on_update": "NO ACTION"
    }
  ]
}
JSON
begin key_file;       run "cat migrations/$KEY"
begin plan_orphan;    run 'migratr --db app.db plan'; status
begin up_orphan_json; run 'migratr --db app.db up --json'; status
sqlite3 app.db "delete from posts where id=4;"
begin plan_key; run 'migratr --db app.db plan'
quiet 'migratr --db app.db up'

tick; begin new_drop; run 'migratr new remove_handle_from_users'
DROP=$(ls migrations | grep remove_handle_from_users)
begin drop_file; run "cat migrations/$DROP"
begin plan_drop; run 'migratr --db app.db plan'
begin up_drop;   run 'migratr --db app.db up'
begin rows_after; run 'sqlite3 app.db "select * from users; select * from posts;"'

begin ledger; run 'sqlite3 app.db "select version, name, checksum from _migratr_migrations;"'
begin status; run 'migratr --db app.db status'
cp "migrations/$DROP" drop.orig
sed -i.bak 's/"handle"/"nickname"/' "migrations/$DROP" && rm -f "migrations/$DROP.bak"
begin status_edited;  run 'migratr --db app.db status'
begin up_edited_json; run 'migratr --db app.db up --json'; status
cp drop.orig "migrations/$DROP"
begin restore_no;  run 'migratr --db app.db restore'; status
begin restore_yes; run 'migratr --db app.db restore --yes'
begin rows_restored;   run 'sqlite3 app.db "select * from users;"'
begin status_restored; run 'migratr --db app.db status'

mkdir -p side && cd side || exit 1
tick; begin side_new
printf '$ migratr new create_notes id:integer:pk body:text\n' >> "$CUR"; migratr new create_notes id:integer:pk body:text >> "$CUR" 2>&1
tick
printf '$ migratr new shout_notes\n' >> "$CUR"; migratr new shout_notes >> "$CUR" 2>&1
SHOUT=$(ls migrations | grep shout_notes)
cat > "migrations/$SHOUT" <<'JSON'
{
  "up": [
    { "op": "raw_sql", "up": "UPDATE notes SET body = upper(body)" }
  ]
}
JSON
begin side_up;        run 'migratr --db notes.db up'
begin side_plan_down; run 'migratr --db notes.db plan down'; status
begin side_down_json; run 'migratr --db notes.db down --json'; status

# the scratch directory prints as a dot
sed -i.bak "s#$W/side#.#g; s#$W#.#g" "$OUT"/*.txt && rm -f "$OUT"/*.bak
echo "captured: $(ls "$OUT" | wc -l) blocks"
