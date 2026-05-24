const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
const validTabs = new Set(tabs.map((tab) => tab.dataset.tab));

function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text) {
    element.textContent = options.text;
  }

  return element;
}

function renderPublications() {
  const target = document.querySelector("#publications-list");

  if (!target || !Array.isArray(window.PUBLICATIONS)) {
    return;
  }

  const groupedByYear = window.PUBLICATIONS
    .slice()
    .sort((first, second) => (second.year || 0) - (first.year || 0))
    .reduce((groups, publication) => {
      const year = publication.year || "Forthcoming";
      if (!groups.has(year)) {
        groups.set(year, []);
      }
      groups.get(year).push(publication);
      return groups;
    }, new Map());

  target.replaceChildren();

  groupedByYear.forEach((publications, year) => {
    const section = createElement("section", { className: "publication-year" });
    const headingId = `pub-${String(year).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const heading = createElement("h2", { text: String(year) });
    const list = createElement("ol", { className: "publication-list" });

    section.setAttribute("aria-labelledby", headingId);
    heading.id = headingId;

    publications.forEach((publication) => {
      const item = createElement("li");
      const article = createElement("article", { className: "publication" });
      const meta = createElement("div", { className: "publication-meta" });
      const title = createElement("h3", { text: publication.title });
      const authors = createElement("p", { className: "authors", text: publication.authors });
      const venue = createElement("p", { text: publication.venue });

      if (publication.type) {
        meta.append(createElement("span", { className: "publication-type", text: publication.type }));
      }

      article.append(meta, title, authors, venue);

      if (Array.isArray(publication.links) && publication.links.length > 0) {
        const links = createElement("div", { className: "paper-links" });

        publication.links.forEach((link) => {
          const anchor = createElement("a", { text: link.label });
          anchor.href = link.url;
          links.append(anchor);
        });

        article.append(links);
      }

      item.append(article);
      list.append(item);
    });

    section.append(heading, list);
    target.append(section);
  });
}

function formatNewsDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatTalkDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

function renderNews() {
  const target = document.querySelector("#news-list");

  if (!target || !Array.isArray(window.NEWS)) {
    return;
  }

  const sortedNews = window.NEWS
    .slice()
    .sort((first, second) => new Date(second.date) - new Date(first.date));

  target.replaceChildren();

  sortedNews.forEach((newsItem) => {
    const item = createElement("li");
    const time = createElement("time", { text: formatNewsDate(newsItem.date) });
    const text = createElement("p");

    time.dateTime = newsItem.date;

    if (newsItem.link) {
      const anchor = createElement("a", { text: newsItem.link.label });
      anchor.href = newsItem.link.url;
      text.append(anchor, ` ${newsItem.description || ""}`);
    } else {
      text.textContent = newsItem.description || "";
    }

    item.append(time, text);
    target.append(item);
  });
}

function createEmptyTalkMessage(text) {
  return createElement("p", { className: "empty-state", text });
}

function createTalkDetails(talk) {
  const details = createElement("details", { className: "talk-item" });
  const summary = createElement("summary");
  const date = createElement("time", { className: "talk-date", text: formatTalkDate(talk.date) });
  const summaryContent = createElement("span", { className: "talk-summary" });
  const title = createElement("span", { className: "talk-title", text: talk.title });
  const speaker = createElement("span", { className: "talk-speaker", text: talk.speaker });
  const body = createElement("div", { className: "talk-description" });

  date.dateTime = talk.date;
  summaryContent.append(title, speaker);
  summary.append(date, summaryContent);

  if (talk.affiliation) {
    body.append(createElement("p", { className: "talk-affiliation", text: talk.affiliation }));
  }

  body.append(createElement("p", { text: talk.description || "Description coming soon." }));

  if (talk.link) {
    const link = createElement("a", { text: "More information" });
    link.href = talk.link;
    body.append(link);
  }

  details.append(summary, body);
  return details;
}

function renderSeminarTalks() {
  const upcomingTarget = document.querySelector("#upcoming-talks");
  const pastTarget = document.querySelector("#past-talks");

  if (!upcomingTarget || !pastTarget || !Array.isArray(window.SEMINAR_TALKS)) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const talks = window.SEMINAR_TALKS
    .slice()
    .filter((talk) => talk.date && talk.speaker && talk.title);

  const upcoming = talks
    .filter((talk) => new Date(`${talk.date}T00:00:00`) >= today)
    .sort((first, second) => new Date(first.date) - new Date(second.date));

  const past = talks
    .filter((talk) => new Date(`${talk.date}T00:00:00`) < today)
    .sort((first, second) => new Date(second.date) - new Date(first.date));

  upcomingTarget.replaceChildren(
    ...(upcoming.length
      ? upcoming.map(createTalkDetails)
      : [createEmptyTalkMessage("No upcoming talks scheduled yet.")])
  );

  pastTarget.replaceChildren(
    ...(past.length
      ? past.map(createTalkDetails)
      : [createEmptyTalkMessage("No past talks yet.")])
  );
}

function resetScroll() {
  window.setTimeout(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, 0);
}

function activateTab(tabName, updateHash = true) {
  const selectedTab = validTabs.has(tabName) ? tabName : "about";

  tabs.forEach((tab) => {
    const isSelected = tab.dataset.tab === selectedTab;
    tab.classList.toggle("is-active", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
  });

  panels.forEach((panel) => {
    const isSelected = panel.id === selectedTab;
    panel.classList.toggle("is-active", isSelected);
    panel.hidden = !isSelected;
  });

  if (updateHash && window.location.hash.slice(1) !== selectedTab) {
    history.pushState(null, "", `#${selectedTab}`);
  }

  resetScroll();
}

function moveFocus(currentTab, direction) {
  const index = tabs.indexOf(currentTab);
  const nextIndex = (index + direction + tabs.length) % tabs.length;
  tabs[nextIndex].focus();
  activateTab(tabs[nextIndex].dataset.tab);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(tab, 1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(tab, -1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      tabs[0].focus();
      activateTab(tabs[0].dataset.tab);
    }

    if (event.key === "End") {
      event.preventDefault();
      const lastTab = tabs[tabs.length - 1];
      lastTab.focus();
      activateTab(lastTab.dataset.tab);
    }
  });
});

window.addEventListener("popstate", () => {
  activateTab(window.location.hash.slice(1), false);
});

renderNews();
renderPublications();
renderSeminarTalks();
activateTab(window.location.hash.slice(1), true);
window.addEventListener("load", resetScroll);
