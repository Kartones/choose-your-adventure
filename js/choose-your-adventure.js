var ChooseYourAdventure = function() {
    /* Placeholder to allow setting up defaults, initial values, etc. via the parameter (ommited here) */
};

ChooseYourAdventure.prototype = {

    data: {},
    base_url: "",
    DEBUG: true,

    Init: function (data) {
        var self = this;
        this.data = data;

        this.base_url = "data/" + data["filename"] + "/";

        if (this.DEBUG) {
            console.log("Adventure contains " + Object.keys(data["locations"]).length + " locations");
        }

        document.title = data["name"];
        $("#title").empty().append(data["name"]);

        $("#adventure-cover").empty().append("<img src=\"" + this.base_url + data["cover"] + "\"/>");
        
        // Add click handler for the adventure cover to hide/show when clicked
        $("#adventure-cover").on("click", function() {
            $(this).toggleClass("hidden");
        });

        $("#actions").on("click", "a.js-gotoaction", function(event) {
            var element = $(this);
            self.ProcessAction(element.attr("data-actiontype"),
                               element.attr("data-actionargument"),
                               event);
        });
        $("#actions").on("click", "a.js-inputaction", function(event) {
            var element = $(this);
            // Current platform limitation: can only have a single location input action per page/location
            self.ProcessAction(element.attr("data-actiontype"),
                               element.attr("data-actionargument"),
                               $("#action-input"));
        });

        this.GoToLocation(this.GetCurrentOrDefaultLocation());
    },

    GetQueryStringParams: function() {
        var queryStringParams = window.location.search.substr(1).split('&'),
            params = {},
            index,
            length,
            param;

        for (index = 0, length = queryStringParams.length; index < length; index++)
        {
            param = queryStringParams[index].split('=', 2);
            if (param.length !== 2) {
                continue;
            }
            params[param[0]] = decodeURIComponent(param[1].replace(/\+/g, " "));
        }

        return params;
    },

    GetCurrentOrDefaultLocation: function() {
        var hash,
            location = this.data["startLocation"];

        if(window.location.hash)
        {
            hash = window.location.hash.substring(1);
            if (!isNaN(parseFloat(hash)) && isFinite(hash))
            {
                location = hash;
            }
        }
        return location;
    },

    GoToLocation: function(index) {
        var actionIndex,
            text;

        if (typeof this.data["locations"][index] === "undefined") {
            throw "Location not found: " + index;
        }

        text = this.data["locations"][index]["text"]
            .replace(/\[\[/gi, "<br/><img src=\"" + this.base_url)
            .replace(/\]\]/gi, "\" />");
        $("#location-text").empty().append(text);

        $("#actions").empty();

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
                for (actionIndex in this.data["locations"][index]["actions"]) {
                    this.RenderAction(this.data["locations"][index]["actions"][actionIndex]);
                }
        }
    },

    RenderAction: function(actionData) {
        switch(actionData["type"]) {
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
        $("#actions").append(
                    "<div class=\"action\">" +
                    actionData["text"] +
                    "</br><span class=\"button-incomplete\">Missing Link</span></div>");
    },

    RenderGoBackAction(actionData) {
        var actionText = actionData["text"].length > 0 ? actionData["text"] : "Continue",
            href = "?adventure-file=" + this.GetQueryStringParams()["adventure-file"] +
                 "&previous=" + this.GetCurrentOrDefaultLocation() +
                 "#" + this.GetQueryStringParams()["previous"];

        $("#actions").append(
            "<div class=\"action\">" +
            actionText +
            "</br><a class=\"button js-gotoaction\" href=\"" + href +
            "\" data-actiontype=\"" + actionData["type"] +
            "\" data-actionargument=\"" + this.GetQueryStringParams()["previous"] +
            "\" >Choose</a></div>");
    },

    RenderGoToLocationAction(actionData) {
        var actionText = actionData["text"].length > 0 ? actionData["text"] : "Continue",
            href = "?adventure-file=" + this.GetQueryStringParams()["adventure-file"] +
                 "&previous=" + this.GetCurrentOrDefaultLocation() +
                 "#" + actionData["argument"];

        $("#actions").append(
            "<div class=\"action\">" +
            actionText +
            "</br><a class=\"button js-gotoaction\" href=\"" + href +
            "\" data-actiontype=\"" + actionData["type"] +
            "\" data-actionargument=\"" + actionData["argument"] +
            "\" >Choose</a></div>");
    },

    RenderLocationInputAction(actionData) {
        $("#actions").append(
            "<div class=\"action\">" +
            actionData["text"] +
            "</br><input type=\"text\" size=\"5\" id=\"action-input\" name=\"action-input'\" class=\"button\"" +
            "\" /> <a class=\"button js-inputaction\"" +
            " data-actiontype=\"" + actionData["type"] +
            "\" data-actionargument=\"" + actionData["argument"] +
            "\" >Choose</a></div>");
    },

    ProcessAction: function(actionType, actionArgument, event) {
        switch(actionType) {
            case "goto":
            case "goback":
                this.GoToLocation(actionArgument);
            break;
            case "location-input":
                if (actionArgument === event.val()) {
                    this.UpdateBrowserHistory(actionArgument);
                    this.GoToLocation(actionArgument);
                }
            break;
        }
    },

    NotifyGameOver: function() {
        $("#info-panel").empty().append("Your adventure is at an end.").show();
    },

    NotifyYouFinished: function() {
        $("#info-panel").empty().append("Congratulations. Your adventure is at an end.").show();
    },

    ClearInfo: function() {
        $("#info-panel").empty().hide();
    },

    GameOverActionData: function() {
        return {
            "type": "goto",
            "argument": this.data["startLocation"],
            "text": "Start again"
        };
    },

    UpdateBrowserHistory: function(actionArgument) {
        var href = "?adventure-file=" + this.GetQueryStringParams()["adventure-file"] +
             "&previous=" + this.GetCurrentOrDefaultLocation() +
             "#" + actionArgument;
        history.replaceState({} , document.title, href);
    }
};
