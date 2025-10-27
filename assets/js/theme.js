(function ($) {
    "use strict";

    if ($(".mobile-nav__wrapper").length) {
        var mobileNavWrapper = $(".mobile-nav__wrapper");
        var mobileNavOverlay = $(".mobile-nav__overlay");
        $(".mobile-nav__toggler").on("click", function (e) {
            e.preventDefault();
            mobileNavWrapper.addClass("expanded");
            $("body").addClass("locked");
        });

        $(".mobile-nav__overlay,.mobile-nav__close").on("click", function (e) {
            e.preventDefault();
            mobileNavWrapper.removeClass("expanded");
            $("body").removeClass("locked");
        });
    }

    // Dynamic Load Scripts
    function loadScript(url, callback) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        if (script.readyState) {
            script.onreadystatechange = function () {
                if (script.readyState == "loaded" || script.readyState == "complete") {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else {
            script.onload = function () {
                callback();
            };
        }
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    }

    // Initialize when page loads
    $(window).on("load", function () {
        if ($(".preloader").length) {
            $(".preloader").fadeOut();
        }
    });
})(jQuery);
