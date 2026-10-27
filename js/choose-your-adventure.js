const ChooseYourAdventure = function () {
  /* Placeholder to allow setting up defaults, initial values, etc. via the parameter (ommited here) */
};

ChooseYourAdventure.prototype = {
  data: {},
  base_url: "",
  DEBUG: true,

  Init: function (data) {
    const self = this;
    this.data = data;

    this.base_url = "data/" + data["filename"] + "/";

    if (this.DEBUG) {
      console.log(
        "Adventure contains " +
          Object.keys(data["locations"]).length +
          " locations"
      );
    }

    document.title = data["name"];
    this.SetHtml(document.getElementById("title"), data["name"]);

    const cover = document.getElementById("adventure-cover");
    this.SetHtml(
      cover,
      '<img src="' + this.base_url + data["cover"] + '"/>'
    );

    // Add click handler for the adventure cover to hide/show when clicked
    cover.addEventListener("click", function () {
      cover.classList.toggle("hidden");
    });

    document
      .getElementById("actions")
      .addEventListener("click", function (event) {
        const gotoLink = event.target.closest("a.js-gotoaction");
        if (gotoLink) {
          self.ProcessAction(
            gotoLink.getAttribute("data-actiontype"),
            gotoLink.getAttribute("data-actionargument"),
            event
          );
          return;
        }

        const inputLink = event.target.closest("a.js-inputaction");
        if (inputLink) {
          // Current platform limitation: can only have a single location input action per page/location
          self.ProcessAction(
            inputLink.getAttribute("data-actiontype"),
            inputLink.getAttribute("data-actionargument"),
            document.getElementById("action-input")
          );
        }
      });

    this.GoToLocation(this.GetCurrentOrDefaultLocation());
  },

  SetHtml: function (element, html) {
    element.innerHTML = html;
  },

  AppendActionHtml: function (html) {
    document
      .getElementById("actions")
      .insertAdjacentHTML("beforeend", html);
  },

  GetQueryStringParams: function () {
    const queryStringParams = window.location.search.substr(1).split("&"),
      params = {};

    for (const queryStringParam of queryStringParams) {
      const param = queryStringParam.split("=", 2);
      if (param.length !== 2) {
        continue;
      }
      params[param[0]] = decodeURIComponent(param[1].replace(/\+/g, " "));
    }

    return params;
  },

  GetCurrentOrDefaultLocation: function () {
    let location = this.data["startLocation"];

    if (window.location.hash) {
      const hash = window.location.hash.substring(1);
      if (!isNaN(parseFloat(hash)) && isFinite(hash)) {
        location = hash;
      }
    }
    return location;
  },

  GoToLocation: function (index) {
    if (typeof this.data["locations"][index] === "undefined") {
      throw "Location not found: " + index;
    }

    const image = this.data["locations"][index]["image"]
      ? this.base_url + this.data["locations"][index]["image"]
      : "";

    this.SetHtml(
      document.getElementById("location-image"),
      image.length > 0 ? '<img src="' + image + '" alt="Location Image" />' : ""
    );

    const text = this.data["locations"][index]["text"]
      .replace(/\[\[/gi, '<br/><img src="' + this.base_url)
      .replace(/\]\]/gi, '" />');
    this.SetHtml(document.getElementById("location-text"), text);

    this.SetHtml(document.getElementById("actions"), "");

    switch (this.data["locations"][index]["type"]) {
      case "gameover":
        this.NotifyGameOver();
        this.RenderAction(this.GameOverActionData());
        break;
      case "ending":
        this.NotifyYouFinished();
        this.RenderAction(this.GameOverActionData());
        break;
      default:
        this.ClearInfo();
        for (const actionIndex in this.data["locations"][index]["actions"]) {
          this.RenderAction(
            this.data["locations"][index]["actions"][actionIndex]
          );
        }
    }
  },

  RenderAction: function (actionData) {
    switch (actionData["type"]) {
      case "goto":
        this.RenderGoToLocationAction(actionData);
        break;
      case "location-input":
        this.RenderLocationInputAction(actionData);
        break;
      case "goback":
        this.RenderGoBackAction(actionData);
        break;
      default:
        this.RenderIncompleteAction(actionData);
        break;
    }
  },

  RenderIncompleteAction(actionData) {
    this.AppendActionHtml(
      '<div class="action">' +
        actionData["text"] +
        '</br><span class="button-incomplete">Missing Link</span></div>'
    );
  },

  RenderGoBackAction(actionData) {
    const actionText =
        actionData["text"].length > 0 ? actionData["text"] : "Continue",
      href =
        "?adventure-file=" +
        this.GetQueryStringParams()["adventure-file"] +
        "&previous=" +
        this.GetCurrentOrDefaultLocation() +
        "#" +
        this.GetQueryStringParams()["previous"];

    this.AppendActionHtml(
      '<div class="action">' +
        actionText +
        '</br><a class="button js-gotoaction" href="' +
        href +
        '" data-actiontype="' +
        actionData["type"] +
        '" data-actionargument="' +
        this.GetQueryStringParams()["previous"] +
        '" >Choose</a></div>'
    );
  },

  RenderGoToLocationAction(actionData) {
    const actionText =
        actionData["text"].length > 0 ? actionData["text"] : "Continue",
      href =
        "?adventure-file=" +
        this.GetQueryStringParams()["adventure-file"] +
        "&previous=" +
        this.GetCurrentOrDefaultLocation() +
        "#" +
        actionData["argument"];

    this.AppendActionHtml(
      '<div class="action">' +
        actionText +
        '</br><a class="button js-gotoaction" href="' +
        href +
        '" data-actiontype="' +
        actionData["type"] +
        '" data-actionargument="' +
        actionData["argument"] +
        '" >Choose</a></div>'
    );
  },

  RenderLocationInputAction(actionData) {
    this.AppendActionHtml(
      '<div class="action">' +
        actionData["text"] +
        '</br><input type="text" size="5" id="action-input" name="action-input\'" class="button"' +
        '" /> <a class="button js-inputaction"' +
        ' data-actiontype="' +
        actionData["type"] +
        '" data-actionargument="' +
        actionData["argument"] +
        '" >Choose</a></div>'
    );
  },

  ProcessAction: function (actionType, actionArgument, event) {
    switch (actionType) {
      case "goto":
      case "goback":
        this.GoToLocation(actionArgument);
        break;
      case "location-input":
        if (actionArgument === event.value) {
          this.UpdateBrowserHistory(actionArgument);
          this.GoToLocation(actionArgument);
        }
        break;
    }
  },

  NotifyGameOver: function () {
    this.ShowInfo("Your adventure is at an end.");
  },

  NotifyYouFinished: function () {
    this.ShowInfo("Congratulations. Your adventure is at an end.");
  },

  ShowInfo: function (message) {
    const infoPanel = document.getElementById("info-panel");
    infoPanel.textContent = message;
    infoPanel.style.display = "";
  },

  ClearInfo: function () {
    const infoPanel = document.getElementById("info-panel");
    infoPanel.textContent = "";
    infoPanel.style.display = "none";
  },

  GameOverActionData: function () {
    return {
      type: "goto",
      argument: this.data["startLocation"],
      text: "Start again",
    };
  },

  UpdateBrowserHistory: function (actionArgument) {
    const href =
      "?adventure-file=" +
      this.GetQueryStringParams()["adventure-file"] +
      "&previous=" +
      this.GetCurrentOrDefaultLocation() +
      "#" +
      actionArgument;
    history.replaceState({}, document.title, href);
  },
};
