(function() {

	Module.add(function($scope) {

		var $timeout = $scope.$timeout;
		var consultant = $scope._consultant;

		$scope.api_basket = {
		    API_URLS: {
		        PRICE_LOOKUP: api_url + 'basket/lookup',
		        BASKET: api_url + 'basket',
		        CHECKOUT: api_url + 'basket/checkout',
		        NEW_SESSION : api_url + 'basket/new_session',
		        BULK_ADD_TO_BASKET: api_url + 'basket/multiple'
		    },
		    session: null,
		    basket: {},
		    price_list: {},
		    basket_price: 0,
		    currency_format: '£',
		    $count: 0,
		    checking_out: false,
		    update_currency_format: function($format) {
		    	var that = this;
		    	$timeout(function() {
		    		that.currency_format = $format == 'GBP' ? '£' : ($format == 'EUR' ? '€' : '$');
	    			$scope.$apply();
	    		});
		    },
		    update_basket_price: function() {
		    	var that = this;
		    	var keys = Object.keys(that.basket);
		    	that.basket_price = 0;

		    	if(keys.length > 0) {
		    		for (var i = keys.length - 1; i >= 0; i--) {
		    			var key = keys[i];
		    			if(typeof that.basket[key].price_data !== 'undefined') {
	    					that.basket_price += that.basket[key].price_data.price * that.basket[key].quantity;
	    					that.update_currency_format(that.basket[key].price_data.currency);
		    			}
		    		}

		    		$timeout(function() {
		    			$scope.$apply();
		    		});
		    	}

		    },
		    set_basket_loader: function($val) {
		    	var that = this;
		    	$val = $val ? true : false;
		    	$timeout(function() {
		    		that.checking_out = $val;
		    		$scope.$apply();
		    	});
		    },
		    set_quantity: function($plu) {
		    	var that = this;
		    	$timeout(function() {
		    		localStorage.setItem('basket_content', JSON.stringify(that.basket));
	    			that.update_basket_price();
	    			$scope.$apply();
	    		});
		    },
		    checkout: function() {
		    	var that = this;

		    	that.init(function($that) {

		    		that.set_basket_loader(true);

			    	/*
			    	 * Add items to server-side basket
			    	 */
			    	 $.ajax({
			    	 	url: that.API_URLS.BULK_ADD_TO_BASKET,
			    	 	type: 'POST',
			    	 	data: {
			    	 		slug: $scope.consultant.url_slug,
			    	 		bid: that.get_bid(),
			    	 		items: $.map(Object.keys(that.basket), function(item, index) {
			    	 			return {
			    	 				plu: that.basket[item].price_data.plu,
			    	 				qty: that.basket[item].quantity
			    	 			}
			    	 		})

			    	 	},
			    	 })
			    	 .done(function(e) {
			    	 	if(e.ok) {
			    	 		if(typeof e.total !== 'undefined') {

			    	 			that.set_basket_loader(false);

			    	 			if(e.total !== that.basket_price) {
			    	 				var q = confirm('There may have been a price change which affects your basket, the total is now: ' + that.currency_format + e.total);
			    	 				if(!q) {
			    	 					return false;
			    	 				}
			    	 			}

		    	 				$.ajax({
		    	 					url: that.API_URLS.CHECKOUT,
		    	 					type: 'POST',
		    	 					data: {
		    	 						slug: $scope.consultant.url_slug,
		    	 						bid: that.get_bid()
		    	 					},
		    	 				})
		    	 				.done(function(e) {
		    	 						
		    	 					if(typeof e.url !== 'undefined') {

		    	 						$('div#checkout-post form').attr('action', e.url);
		    	 						$('div#checkout-post form input[name="bid"]').val(e.parameters.bid);
		    	 						$('div#checkout-post form input[name="cky"]').val(e.parameters.cky);

		    	 						// Empty basket on checkout
		    	 						localStorage.removeItem('basket_content');

		    	 						$('div#checkout-post form').submit();

		    	 					} else {
		    	 						M.toast({
					                    	html: ('An error occured, please try again'),
						                    displayLength: 3000
						                });
		    	 					}

		    	 				})
		    	 				.fail(function(e) {
		    	 					console.log("error", e);
		    	 				});
		    	 				

			    	 		} else {
			    	 			M.toast({
			                    	html: ('An error occured, please try again'),
				                    displayLength: 3000
				                });
			    	 		}

			    	 	} else {
			    	 		M.toast({
		                    	html: (e.msg),
								displayLength: 3000
			                });
			    	 	}
			    	 })
			    	 .fail(function(e) {
			    	 	M.toast({
	                    	html: ('An error occured, please try again'),
		                    displayLength: 3000
		                });
			    	 });

		    	}, true);
		    },
		    get_bid: function() {
		    	var that = this;
		    	var session = localStorage.getItem('basket_session');
		        var content = localStorage.getItem('basket_content');


		        if(!session || session == 'null' || session == null) {
		        	return false;
		        } else {
		            session = JSON.parse(session);
		            if((new Date().getTime() / 1000) >= session.expiry_epoch) {
		                return false;

		            } else {
		            	return session.bid;
		            }
		        }
		    },
		    bid_expired: function() {
		    	var that = this;
		    	var session = localStorage.getItem('basket_session');

		    	if(!session || session == 'null' || session == null) {
		    		return true;
		    	}

		    	session = JSON.parse(session);
	            if((new Date().getTime() / 1000) >= session.expiry_epoch) {
	            	return true;
	            } 
	            that.session = session;
	            return false;

		    },
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
		                that.update_currency_format(e.currency);
		            } else {
		                that.price_list[$plu] = {
		                    error: true
		                };
		            }

		            $scope.$apply();

		            that.update_basket_price();
		            
		        })
		        .fail(function() {
		            that.price_list[$plu] = {
		                error: true
		            };
		            $scope.$apply();
		            
		        });
		        
		    },
		    init: function($callback) {

		        var that = this;
		        var content = localStorage.getItem('basket_content');
		        var bid = that.get_bid();

		        $callback = $callback || function(e) {};

		        if(!bid) {
		        	return that.new_session($callback);
		        }

		        if(that.bid_expired()) {
		        	that.new_session($callback);
		        } else {
		        	if(content && content !== 'null') {
			        	content = JSON.parse(content);
			        	$timeout(function() {

			        		that.basket = content;
			        		that.$count = Object.keys(that.basket).length;
			        		that.update_basket_price();
			        		$callback(that);
			        		$scope.$apply();
			        	});
			        }
		        }
		        

		        /*
		         * Hidrate basket
		         */
		        setInterval(function() {

		            if(that.bid_expired()) {
		                that.new_session();
		            }

		            that.update_basket_price();

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
		    			localStorage.setItem('basket_content', JSON.stringify(that.basket));
		    			that.update_basket_price();
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

		    		if(typeof that.price_list[product.plu] !== 'undefined') {
		    			that.basket[product.plu].price_data = that.price_list[product.plu];
		    		}

		    		localStorage.setItem('basket_content', JSON.stringify(that.basket));
		    		that.update_basket_price();

		    		$scope.$apply();

		    		M.toast({
	                    html: ('Added ' + product.item.name + ' to basket'),
	                        displayLength: 3000
	                });
		    	});


		    },
		    new_session: function($callback) {
		        var that = this;
		        var slug = $scope.consultant_query.slug;
		        console.log('new session');
		        localStorage.removeItem('basket_session');

		        $.ajax({
		            url: that.API_URLS.NEW_SESSION,
		            type: 'GET',
		            dataType: 'json',
		            data: {slug: slug},
		        })
		        .done(function(e) {
		        	console.log(e);
		            if(e.ok) {
		                that.session = e.api;
		                localStorage.setItem('basket_session', JSON.stringify(e.api));
		                if($callback && e.api !== null) {
		                	that.init($callback);
		                }

		                if(e.api == null) {
		                	 M.toast({
			                    html: ('An error occured setting up basket!'),
			                        displayLength: 3000,
			                });
		                }

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