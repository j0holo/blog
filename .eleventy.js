const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight"),
  markdownIt = require("markdown-it"),
  pluginRss = require("@11ty/eleventy-plugin-rss");
module.exports = (eleventyConfig) => {
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("assets/images");
  const options = {
    html: true,
    breaks: true,
    linkify: false,
  };
  eleventyConfig.setLibrary("md", markdownIt(options));

  eleventyConfig.addFilter("isoDate", (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  return {
    // Use liquid in html templates
    htmlTemplateEngine: "liquid",
  };
};
