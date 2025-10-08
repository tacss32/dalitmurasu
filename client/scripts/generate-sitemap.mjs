import fs from "fs";

// Your website's domain
const DOMAIN = "https://www.dalitmurasu.com";

// Your API endpoint
const API = "http://localhost:3030"; // Or your production API URL

async function generateSitemap() {
  console.log("Fetching data for sitemap...");

  // 1. Fetch all dynamic URLs (categories, posts, etc.)
  const categoryRes = await fetch(`${API}/api/categories`);
  const categories = await categoryRes.json();
  const categoryUrls = categories.map(
    (category) => `${DOMAIN}/${category.slug}`
  );

  const postsRes = await fetch(`${API}/api/universal-posts`); // Assuming you have an endpoint for all posts
  const posts = await postsRes.json();
  const postUrls = posts.map((post) => `${DOMAIN}/posts/${post._id}`);

  // 2. Add your static page URLs
  const staticUrls = [
    DOMAIN,
    `${DOMAIN}/about`,
    `${DOMAIN}/contact`,
    // Add any other static pages here
  ];

  const allUrls = [...staticUrls, ...categoryUrls, ...postUrls];

  // 3. Generate the XML content
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls
    .map(
      (url) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("")}
</urlset>`;

  // 4. Write the file to the public directory
  fs.writeFileSync("public/sitemap.xml", sitemapContent);
  console.log("sitemap.xml generated successfully!");
}

generateSitemap();
