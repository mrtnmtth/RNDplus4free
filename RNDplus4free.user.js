// ==UserScript==
// @name     RNDplus4free
// @description Laden des Artikel-Textes aus dem JSON im Quelltext
// @version  0.6.0
// @match https://*.haz.de/*.html*
// @match https://*.neuepresse.de/*.html*
// ==/UserScript==

var site_loaded = false;
var script_text = "";
var article = "";

var teaser_node = document.querySelectorAll("[class^=ArticleHeadstyled__ArticleTeaserContainer]")[0];
var loader_node = document.querySelectorAll("[class^=ArticleContentLoader]")[0];

// MutationObserver to detect when the article teaser is loaded
let observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;
        if (mutation.target.id === "fusion-app") {
            let ad_wrapper = document.getElementById("piano-lightbox-article-haz");
            if (ad_wrapper) {
                ad_wrapper.remove();
                get_article();
                change_page();
            }
        }
    }
});

observer.observe(document, {attributes: false, childList: true, characterData: false, subtree: true});

function get_article(){
    let script = document.getElementById("fusion-metadata");

            script_text=script.innerHTML;
            try
            {
                article = JSON.parse(script_text.match(/Fusion.globalContent=(\{[\s\S]*?});/)[1]);
            }
            catch(err) {
                console.log(script_text);
            }
}

function change_page(){
    // make header fully visible
    document.querySelectorAll("[class^=ArticleHeadstyled__ArticleTeaserContainer]")[0].style.height = "100%";

    // remove headline 2
    document.querySelectorAll("[class^=Headlinestyled__Headline")[1].innerHTML = "";

    // remove article skeleton
    document.querySelectorAll("[class^=Articlestyled__ArticleBodyWrapper")[0].innerHTML = "";

    // insert gathered article metadata & text
    reset_teaser_style();
    insert_article_details();
    insert_divider();
    insert_article();
}

function reset_teaser_style() {
    let teaser = document.querySelectorAll("[class^=Textstyled__Text")[0];
    teaser.style.overflow = "visible";
    teaser.style.height = "unset";
}

function insert_article_details() {
    let html = document.querySelectorAll("[class^=ArticleHeadstyled__ArticleHeader]")[0];
    let a_class = document.querySelectorAll("[class^=Linkstyled__Link")[1].className.match(/\b\w{6}\b/);

    let detailsContainer = document.createElement("div");
    detailsContainer.style.marginBottom = "24px";
    detailsContainer.style.marginTop = "16px";

    detailsContainer.style.fontFamily = "Inter, Arial-adjusted-for-Inter, Roboto-adjusted-for-Inter, sans-serif";
    detailsContainer.style.fontSize = "14px";
    detailsContainer.style.fontWeight = "500";
    detailsContainer.style.letterSpacing = "0px";
    detailsContainer.style.lineHeight = "18px";

    article.authors.forEach((author) => {
        let a = document.createElement("a");
        a.rel = "author";
        a.text = author.name;

        if (author.url) {
            a.href = author.url;
        }

        let articleMetaAuthors = document.createElement("address");

        articleMetaAuthors.append(a);
        detailsContainer.append(articleMetaAuthors);
    });

    let time = document.createElement("time");
    time.datetime = article.firstPublishDate;
    let date = new Date(article.firstPublishDate);
    time.innerText = date.toLocaleString();

    detailsContainer.append(time);
    html.append(detailsContainer);
}

function insert_divider() {
    let html = document.querySelectorAll("[class^=ArticleHeadstyled__ArticleHeader]")[0];

    let dividerWrapper = document.createElement("div");
    dividerWrapper.className = "ArticleHeadstyled__ArticleDivider";
    dividerWrapper.style.marginBottom = "24px";
    dividerWrapper.style.marginTop = "8px";

    let divider = document.createElement("div");
    divider.className = "Dividerstyled__Divider ";
    divider.style.borderTop = "2px dotted rgb(197, 210, 221)";
    divider.style.fontSize = "2px";
    divider.style.height = "0px";
    divider.style.width = "100%";

    dividerWrapper.append(divider);
    html.append(dividerWrapper);
}

function insert_article(){
    let html = document.querySelectorAll("[class^=ArticleHeadstyled__ArticleHeader")[0];
    let headline_class = document.querySelectorAll("[class^=Headlinestyled__Headline")[1].className;
    let inline_text_class = document.querySelectorAll("[class^=Textstyled__Text")[0].className;
    inline_text_class = inline_text_class.match(/\b\w{6}\b/);

    article.elements.forEach((element) => {
        if (element.type == "header") {
            let h2 = document.createElement("h2");
            h2.className = headline_class;
            h2.innerHTML = element.text;
            h2.style.marginTop = "8px";

            html.append(h2);
        }
        else if (element.type == "text") {
            let p = document.createElement("p");
            p.className = inline_text_class;
            p.innerHTML = element.text;

            html.append(p);
        }
        else if (element.type == "list" && !element.list.isOrdered) {
            let ul = document.createElement("ul");
            ul.className = inline_text_class;

            element.list.items.forEach((item) => {
                let li = document.createElement("li");
                li.innerHTML = item.text;
                ul.append(li);
            });

            html.append(ul);
        }
        else if (!["ad", "newsletterAd"].includes(element.type)) {
            console.log("Unknown content element type", element);
        }
    });
}
