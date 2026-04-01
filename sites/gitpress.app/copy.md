# Stop paying for complexity you didn't ask for.

Your content is a file. It has always been a file. The CMS industry convinced you it needed to be a database entry with a schema, a taxonomy, a content model, an API layer, a CDN, a webhook pipeline, and a migration strategy.

For a blog post. For a pricing page. For three words your marketer could have changed in two minutes.


## The problem is not your content. The problem is the door.

Your site runs on Astro, Next, Hugo. Your content is markdown in a GitHub repo. Version controlled. Reviewed through pull requests. Deployed through CI. The architecture is already right.

The only thing missing is a way for your team to walk in and make a change without asking a developer to hold the door open.

GitPress is that door. Install it from GitHub Marketplace. Pick a content folder. Invite your team. They edit, they submit, you review a clean diff. No migration. No schema builder. No admin panel. No taxonomy for your pricing page.


## Built for the bakery. Scales to the newsroom.

A five-person team with a marketing site uses GitPress with one folder of markdown and zero configuration. That is the whole product for them.

A newsroom with fifty editors, ten markets, and five output channels uses the same product with serializers. The same content goes to the website as MDX, to the mobile app as JSON, to the press wire as LaTeX, to email as HTML, to print as PDF. One edit. One approval. Five outputs.

The architecture does not change between the bakery and the newsroom. The bakery just uses less of it.

Your CMS vendor charges per channel. GitPress charges once. The serializers are open source. Add your own.


## What you are actually paying $300/month for.

Contentful does not charge $300 because the problem is $300 hard. Contentful charges $300 because they made the solution $300 complicated. They built the complexity, sold you the complexity, then sold you the support contract for the complexity they created.

Here is what a headless CMS gives you that you did not ask for:

| You need | They sell you |
|----------|-------------|
| Edit a markdown file | A content model builder |
| Three blog categories | A taxonomy system |
| One language | A localization pipeline |
| Content in your repo | An API layer between you and your own files |
| The ability to leave | A migration path in and no migration path out |

GitPress gives you a door to the content you already have, in the repo you already own, reviewed through the workflow you already use.


## What happens when you install GitPress.

1. Install from GitHub Marketplace. Pick your repo. Pick your content folder. That is the setup.
2. Invite your teammate. They get a link.
3. They open GitPress, find the pricing page, fix the typo, hit Submit.
4. You get a pull request. Clean diff. Three words changed, nothing else. Approve it.
5. The site rebuilds. The typo is fixed. You were not involved.

Your teammate did not learn Git. They did not open a terminal. They did not ask you for help. They just fixed the typo. That is the product.


## Your content stays in your repo. Period.

GitPress does not store your content. It does not copy it to a database. It does not add metadata that breaks without the tool. Your markdown files are your markdown files. If you uninstall GitPress tomorrow, nothing happens. Your content is still there, still in your repo, still version controlled, still deploying through your pipeline.

Try uninstalling Contentful and see what you have left.


## Open source. Because your content pipeline should not be a vendor secret.

The GitPress core is open source. The same architecture. The same serializers. The same editor. The Marketplace version adds team management and billing. That is the only difference.

If you want to self-host, you can. If you want to build a custom serializer for a channel we have never heard of, you can. If you want to read every line of code that touches your content, you can.

The companies charging you $300/month for a content API do not let you read the source. We do.
