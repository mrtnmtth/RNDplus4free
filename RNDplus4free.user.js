// ==UserScript==
// @name     RNDplus4free
// @description Laden des Artikel-Textes aus dem JSON im Quelltext
// @version  0.8.0
// @match https://*.haz.de/*.html*
// @match https://*.neuepresse.de/*.html*
// @match https://*.sn-online.de/*.html*
// @match https://*.waz-online.de/*.html*
// @match https://*.dnn.de/*.html*
// @match https://*.goettinger-tageblatt.de/*.html*
// @match https://*.lvz.de/*.html*
// @match https://*.ln-online.de/*.html*
// @match https://*.kn-online.de/*.html*
// @match https://*.maz-online.de/*.html*
// @match https://*.ostsee-zeitung.de/*.html*
// @match https://*.paz-online.de/*.html*
// @match https://*.rnd.de/*.html*
// @match https://*.dewezet.de/*.html*
// @match https://*.cz.de/*.html*
// @match https://*.szlz.de/*.html*
// @match https://*.saechsische.de/*.html*
// @match https://*.dieharke.de/*.html*
// ==/UserScript==

let article = "";

const app_node = document.getElementById("fusion-app");

// MutationObserver to detect when the article teaser is loaded
let observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;

        let ad_wrapper = document.querySelector('[id^="piano-lightbox-article"]');
        if (ad_wrapper) {
            if (!is_paywalled_article()) {
                observer.disconnect();
                break;
            }

            ad_wrapper.remove();
            if (get_article()) {
                change_page();
            }

            observer.disconnect();
            break;
        }
    }
});

observer.observe(app_node, {attributes: false, childList: true, characterData: false, subtree: true});

function is_paywalled_article() {
    const content_node = document.getElementById("contentMain");

    return content_node.querySelectorAll("[class^=PaidIconstyled]").length > 0;
}

function get_article(){
    let script = document.getElementById("fusion-metadata");
    let script_text = script.innerHTML;

    try {
        article = JSON.parse(script_text.match(/Fusion.globalContent=(\{[\s\S]*?});/)[1]);
        return true;
    }
    catch(err) {
        console.error("RNDplus4free: failed to parse globalContent", err);
        console.log(script_text);
        return false;
    }
}

function change_page(){
    // make header fully visible
    document.querySelectorAll('[class^="ArticleHeadstyled__ArticleTeaserContainer"]')[0].style.height = "100%";

    // remove headline 2
    document.querySelectorAll('[class^="Headlinestyled__Headline"]')[1].innerHTML = "";

    // remove article skeleton
    document.querySelectorAll('[class^="Articlestyled__CenteredContentWrapper"]')[1].innerHTML = "";

    // insert gathered article metadata & text
    reset_teaser_style();
    insert_article_details();
    insert_divider();
    insert_article();
}

function reset_teaser_style() {
    let teaser = document.querySelectorAll('[class^="Textstyled__Text"]')[0];
    teaser.style.overflow = "visible";
    teaser.style.height = "unset";
}

function insert_article_details() {
    let html = document.querySelectorAll('[class^="ArticleHeadstyled__ArticleHeader"]')[0];

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
    let html = document.querySelectorAll('[class^="ArticleHeadstyled__ArticleHeader"]')[0];

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

function create_image(info) {
    let figure = document.createElement("figure");
    figure.style.margin = "16px 0";

    let img = document.createElement("img");
    // imageInfo.src is the raw CloudFront origin (not public); the site
    // renders the signed resizer URL built from the image id + auth token
    img.src = `/resizer/v2/${info.id}.jpg?auth=${Object.values(info.auth)[0]}&quality=70&width=828`;
    img.alt = info.alt || "";
    img.loading = "lazy";
    img.style.width = "100%";
    img.style.height = "auto";
    figure.append(img);

    if (info.caption || info.credit) {
        let figcaption = document.createElement("figcaption");
        figcaption.style.fontFamily = "Inter, Arial-adjusted-for-Inter, Roboto-adjusted-for-Inter, sans-serif";
        figcaption.style.fontSize = "12px";
        figcaption.style.lineHeight = "16px";
        figcaption.style.marginTop = "8px";

        if (info.caption) {
            let caption = document.createElement("div");
            caption.innerText = info.caption;
            caption.style.color = "var(--ldc-52)";
            figcaption.append(caption);
        }

        if (info.credit) {
            let credit = document.createElement("div");
            credit.innerText = info.credit;
            credit.style.color = "var(--ldc-63)";
            credit.style.marginTop = "8px";
            figcaption.append(credit);
        }

        figure.append(figcaption);
    }

    return figure;
}

function create_quote(element) {
    let figure = document.createElement("figure");
    figure.style.display = "flex";
    figure.style.flexDirection = "column";
    figure.style.alignItems = "center";
    figure.style.textAlign = "center";
    figure.style.borderTop = "1px solid var(--ldc-25)";
    figure.style.borderBottom = "1px solid var(--ldc-25)";
    figure.style.margin = "16px 0";
    figure.style.padding = "32px";

    // green accent bar the site renders via a ::before pseudo-element
    let accent = document.createElement("div");
    accent.style.width = "40px";
    accent.style.height = "2px";
    accent.style.marginBottom = "16px";
    accent.style.backgroundColor = "#6bb024";
    figure.append(accent);

    let blockquote = document.createElement("blockquote");
    blockquote.style.fontFamily = '"Source Serif Pro", Palatino, "Droid Serif", serif';
    blockquote.style.fontSize = "21px";
    blockquote.style.fontWeight = "600";
    blockquote.style.lineHeight = "26px";
    blockquote.style.margin = "0";

    element.elements.forEach((text) => {
        let p = document.createElement("p");
        p.innerHTML = text;
        blockquote.append(p);
    });

    figure.append(blockquote);

    if (element.author) {
        let figcaption = document.createElement("figcaption");
        figcaption.innerText = element.author;
        figcaption.style.fontFamily = "Inter, Arial-adjusted-for-Inter, Roboto-adjusted-for-Inter, sans-serif";
        figcaption.style.fontSize = "14px";
        figcaption.style.marginTop = "16px";
        figcaption.style.color = "var(--ldc-63)";
        figure.append(figcaption);
    }

    return figure;
}

function insert_article(){
    let html = document.querySelectorAll('[class^="ArticleHeadstyled__ArticleHeader"]')[0];
    let headline_class = document.querySelectorAll('[class^="Headlinestyled__Headline"]')[1].className;
    let inline_text_class = document.querySelectorAll('[class^="Textstyled__Text"]')[0].className;
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
        else if (element.type == "image") {
            html.append(create_image(element.imageInfo));
        }
        else if (element.type == "quote") {
            html.append(create_quote(element));
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
