(function() {
	
	Module.add(function($scope) {

		var $timeout = $scope.$timeout;
		var consultant = $scope._consultant;

		$scope.start_tutorial = function() {
            M.Modal.getInstance($('#root_setup')).close();
            introJs().setOptions({
              steps: [{
                intro: "In the center of your screen is the catalogue viewer, here you can view the latest Catalogue from NYR. You can drag the bottom right of the catalogue page to flip between pages.",
              }, 
              {
                element: $('#toast-container')[0],
                intro: "At the top right of your screen are notification popups, these will either tell your customers if there are items available to view or other important notifications."
              },
              {
                element: $('nav div.nav-wrapper')[0],
                intro: "This is the Sidebar which lists out all available links whilst your customers are browsing the Catalogue."
              },
              {
                element: $('#nav-mobile li:nth-child(1)')[0],
                intro: "The NYR Organic logo links your customers directly to your NYR Organic shop at any time."
              },
              {
                element: $('#nav-mobile li:nth-child(2)')[0],
                intro: "This is the Available Item viewer. When your customers are browsing the catalogue, any items that are available in the page will appear as a sidebar slide out when this button is selected. You can see that there are some items available to view on this page. Let's go ahead and open the sidebar.."
              },
              
              {
                element: $('#basket_sidebar')[0],
                intro: "Here we can see all available products that are displayed within the catalogue page. We can show and hide this sidebar at any time by clicking outside of it."
              },
              {
                element: $('#basket_sidebar > li:first-child header')[0],
                intro: "Here we can see the total amount of items to see on this page, we can also choose to sort them alphabetically or reverse alphabetically."
              },
              {
                element: $('#basket_sidebar > li:nth-child(2)')[0],
                intro: "Each item is displayed as a card, showing the product image, title, price and links to either favourite or view more info."
              },
              {
                element: $('#basket_sidebar > li:nth-child(2)')[0],
                intro: "Clicking More Info on an item will display more information about this product in a separate pop up window."
              },
              {
                element: $('#basket_sidebar > li:nth-child(2)')[0],
                intro: "Favouriting an item adds it to your Favourites list, let's go ahead and favourite this one."
              },
              {
                element: $('#toast-container')[0],
                intro: "You will receive a notification at the top right telling you that an item has been added or removed from your Favourites"
              },
              {
                element: $('a[data-target="favourites_sidebar"]')[0],
                intro: "This button is where all of the items you have favourited are kept, you can see that the total number of favourites are displayed above the icon. Let's open your favourites now."
              },
              {
                element: $('#favourites_sidebar')[0],
                intro: "This is your Favourites list, here we list all of the items you have favourited."
              },
              {
                element: $('#favourites_sidebar div[ng-show="favourite.$count"]')[0],
                intro: "Your customers can send their favourites directly to you in an email for convenience."
              },
              {
                element: $('#favourites_sidebar li:nth-child(2) div.col.s12')[0],
                intro: "Your customers can view an item directly from within the Favourites list or remove them."
              },
              {
                element: $('a[data-tooltip="Share Catalogue"]')[0],
                intro: "This is Share Catalogue button, here your customers can share your Smart Catalogue over multiple Social Media platforms."
              },
              {
                element: $('a[data-tooltip="Contact Consultant"]')[0],
                intro: "This is the Contact Consultant button which lets your customers contact you directly as well as install your app and other useful links."
              },
              {
                intro: "You have now reached the end of the tutorial, you can now setup your own Smart Catalogue or play with the functionality in this one."
              }
            ]
            })
            .onexit(function() {
              M.Modal.getInstance($('#root_setup')).open();
            })
            .onchange(function(targetElement) {  
                var step = this._currentStep;
                if(step == 1) {
                    var cat = $scope.catalogue.get();
                    var items = cat[$scope.consultant.data.region + '_items'].items;
                    var first_item = Object.keys(items)[0];
                    var page = items[first_item].page;

                    $scope.flipbook.ctrl.goToPage(page);
                }
                if(step == 5) {
                    M.Sidenav.getInstance($('#basket_sidebar')).open();
                }
                if(step == 10) {
                    var cat = $scope.catalogue.get();
                    var items = cat[$scope.consultant.data.region + '_items'].items;
                    var first_item = Object.keys(items)[0];
                    $scope.favourite.set(items[first_item].id, 1);
                }
                if(step == 11) {
                    M.Sidenav.getInstance($('#basket_sidebar')).close();
                }
                if(step == 12) {
                    M.Sidenav.getInstance($('#favourites_sidebar')).open();
                }
                if(step == 15) {
                    M.Sidenav.getInstance($('#favourites_sidebar')).close();
                }
            }).start();
        };

	}, 10);

})();