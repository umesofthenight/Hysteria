# Hysteria: your own GitHub Pages website

This package contains the complete current website: all 23 archive references, the credits page, custom 404, images, fonts, favicon, styles and working interactions. It does not need ChatGPT, an OpenAI account, API keys, a database or paid website software to run.

## Publish it

1. Extract this ZIP on your computer.
2. On GitHub, create a repository named `hysteria`, using `main` as its default branch. A public repository works with GitHub Free. GitHub Pages availability for private repositories depends on your plan.
3. Upload the **contents** of the extracted `Hysteria-GitHub-Pages` folder to the repository. The repository's top level must contain `site`, `scripts`, `package.json`, and `.github/workflows/deploy.yml`. Do not upload the ZIP itself or an extra enclosing folder. Include the `.github` folder.
4. Open the repository's **Settings > Pages**. Under **Build and deployment > Source**, choose **GitHub Actions**.
5. Open **Actions > Publish Hysteria to GitHub Pages > Run workflow**, select `main`, and run it. This first manual run is useful if the upload happened before Pages was enabled.
6. Once the run succeeds, open **Settings > Pages** and use the displayed website link. It will normally look like `https://YOUR-USERNAME.github.io/hysteria/`.

The workflow detects your actual Pages address. There is no username to replace in the code. Images, archive links, readers, canonical metadata and sitemap URLs are adjusted automatically. Later commits to `main` publish automatically.

If you see a configure-pages error, check that Pages is enabled with GitHub Actions as its source, then run the workflow again. If no workflow appears, check that `.github/workflows/deploy.yml` is at the repository root. If you choose a branch other than `main`, change the branch in that workflow too.

## Files and editing

- `site/index.html`: home page, reader markup, Discord widget and home footer.
- `site/styles.css` and `site/enhancements.css`: design, responsive layout and persistent navigation.
- `site/app.js`, `site/ui.js`, `site/reference.js`: archive search, pathway readers, sanity control and shared behavior.
- `site/archive/`: the full archive index and 23 formatted reference pages.
- `site/credits/index.html` and `site/404.html`: credits and error page.
- `site/assets/`: every image and font needed by the design.
- `site/content/index.json`: archive search titles and descriptions.
- `site/content/pathways.json`: pathway names and starting Sequence names.
- `scripts/build-pages.mjs`: creates the publishable `_site` folder with correct URLs.
- `.github/workflows/deploy.yml`: publishes `_site` to GitHub Pages.

Edit the files in `site`, then commit the changes. The formatted HTML is the editable website source in this package. The original private Markdown documents, credentials, Git history, ChatGPT deployment configuration and local QA files are not included. Raw source downloads stay absent.

Changing a reference's content means editing its `site/archive/.../index.html`. If you rename a reference or change its description, also update its entry in `site/content/index.json`. To update the Discord invitation, replace `https://discord.com/invite/zTKrfSbX` throughout `site`. The widget's server ID remains in the home page.

Keep the existing artwork, typography and setting acknowledgements on the credits page. Third-party material retains its existing rights; this package does not relicense the logos, fonts, fiction or illustrations.

## Preview on your computer (optional)

Install Node.js 22 or newer, open a terminal in this folder, then run:

```text
npm run dev
```

Open `http://127.0.0.1:4173/`. No package installation is needed. Use Ctrl+C to stop. Opening index.html directly by double-clicking will not run the interactive readers correctly.

To preview the repository path too:

```text
npm run build -- https://YOUR-USERNAME.github.io/hysteria/
npm run preview
```

Open `http://127.0.0.1:4173/hysteria/`.

## Your own domain or another host

For a custom domain on GitHub Pages, configure that domain under Settings > Pages and follow GitHub's DNS instructions, then rerun the workflow. The workflow uses the configured address automatically.

For a different static hosting service, run `npm run build -- https://your-actual-domain.example/` with your real address and upload the **contents of `_site`** to that host. Configure its not-found page to use `404.html`. The entire site is static.

GitHub Pages does not carry over the owner-only access settings from ChatGPT hosting. Treat the published website as publicly readable. As with any readable website, visitors can save page content even though no download controls or raw Markdown files are provided.

## Official instructions

- GitHub Pages workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Custom domains: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

The included workflow has been prepared and the exported website tested locally. It has not been deployed to your GitHub account. Your existing ChatGPT-hosted website has not been changed or removed.
