const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
const validTabs = new Set(tabs.map((tab) => tab.dataset.tab));

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

activateTab(window.location.hash.slice(1), true);
window.addEventListener("load", resetScroll);
