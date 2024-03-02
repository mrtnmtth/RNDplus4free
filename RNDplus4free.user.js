// ==UserScript==
// @name     RNDplus4free
// @description Laden des Artikel-Textes aus dem JSON im Quelltext
// @version  0.5.0
// @match https://*.haz.de/*.html*
// @match https://*.neuepresse.de/*.html*
// ==/UserScript==

var site_loaded = false;
var script_text = "";
var article = "";
var article_elements = [];

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
                if(article.elements != "")
                {
                    article_elements = article.elements;
                }
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

    // insert gathered article text
    insert_article();
}

function insert_article(){
    let html = document.querySelectorAll("[class^=Textstyled__Text")[0].parentElement;
    let headline_class = document.querySelectorAll("[class^=Headlinestyled__Headline")[1].className;
    let inline_text_class = document.querySelectorAll("[class^=Textstyled__Text")[0].className;
    inline_text_class = inline_text_class.match(/\b\w{6}\b/);

    document.querySelectorAll("[class^=Textstyled__Text")[0].className = inline_text_class;

    article_elements.forEach((element) => {
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
