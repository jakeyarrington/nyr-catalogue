(function() {

	Module.add(function($scope) {

		var $timeout = $scope.$timeout;
		var consultant = $scope._consultant;

		$scope.api_basket = {
		    API_URLS: {
		        PRICE_LOOKUP: api_url + 'basket/lookup',
		        BASKET: api_url + 'basket',
		        NEW_SESSION : api_url + 'basket/new_session'
		    },
		    session: null,
		    basket: {},
		    price_list: {},
		    $count: 0,
		    get_price: function($plu) {
		        var that = this;

		        if(typeof that.price_list[$plu] !== 'undefined') {
		            return that.price_list[$plu];
		        }

		        $.ajax({
		            url: that.API_URLS.PRICE_LOOKUP,
		            type: 'GET',
		            data: {slug: $scope.consultant_query.slug, plu: $.trim($plu.replace('PLU',''))},
		        })
		        .done(function(e) {
		            if(e.ok) {
		                that.price_list[$plu] = e.detail;
		                that.price_list[$plu].currency = e.currency;
		            } else {
		                that.price_list[$plu] = {
		                    error: true
		                };
		            }

		            $scope.$apply();
		            
		        })
		        .fail(function() {
		            that.price_list[$plu] = {
		                error: true
		            };
		            $scope.$apply();
		            
		        });
		        
		    },
		    init: function() {
		        var that = this;
		        var session = localStorage.getItem('basket_session');

		        if(!session || session == 'null') {
		            this.new_session();
		        } else {
		            session = JSON.parse(session);
		            if((new Date().getTime() / 1000) >= session.expiry_epoch) {
		                localStorage.removeItem('basket_session');
		                that.new_session();
		            }
		        }

		        /*
		         * Hidrate basket
		         */
		        setInterval(function() {

		            if((new Date().getTime() / 1000) >= session.expiry_epoch) {
		                localStorage.removeItem('basket_session');
		                that.new_session();
		            }

		        }, 15000);

		    },
		    decrement: function() {
		    	var that = this;

		    	that.$count--;

		    	if(that.$count < 0) {
		    		that.$count = 0;
		    	}
		    },
		    increment: function() {
		    	var that = this;

		    	that.$count++;
		    },
		    remove_from_basket: function($plu) {
		    	var that = this;

		    	if(typeof that.basket[$plu] !== 'undefined') {
		    		$timeout(function() {

		    			that.decrement();

		    			delete that.basket[$plu];
		    			$scope.$apply();

		    			M.toast({
	                    html: ('Removed item from basket'),
		                        displayLength: 3000
		                });

		    		});
		    	}

		    },
		    add_to_basket: function($plu) {
		    	var that = this;

		    	var product = $scope.get_product_by_plu($plu);

		    	if(!product) {
		    		return M.toast({
	                    html: ('An error occured adding product to basket!'),
	                        displayLength: 3000
	                });
		    	}

		    	$timeout(function() {

		    		if(typeof that.basket[product.plu] == 'undefined') {
		    			that.basket[product.plu] = product;
		    			that.basket[product.plu].quantity = 0;
		    			that.increment();

		    		}
		    		that.basket[product.plu].quantity++;
		    		$scope.$apply();

		    		M.toast({
	                    html: ('Added ' + product.item.name + ' to basket'),
	                        displayLength: 3000
	                });
		    	});


		    },
		    new_session: function() {
		        var that = this;
		        var slug = $scope.consultant_query.slug
		        $.ajax({
		            url: that.API_URLS.NEW_SESSION,
		            type: 'GET',
		            dataType: 'json',
		            data: {slug: slug},
		        })
		        .done(function(e) {
		            if(e.ok) {
		                that.session = e.api;
		                localStorage.setItem('basket_session', JSON.stringify(e.api));
		            } else {
		                M.toast({
		                    html: ('An error occured setting up basket!'),
		                        displayLength: 3000,
		                });
		            }
		        })
		        .fail(function() {
		            console.log("error");
		        });
		        
		    }
		};

	}, 10);

	

})();