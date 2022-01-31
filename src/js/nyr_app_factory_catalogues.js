appController.factory('catalogues', function() {

    var http = new Promise((resolve, reject) => {
        $.ajax({
            url: cdn_url + '/catalogue/catalogue.json?cache_buster=true',
            type: 'GET',
            success: function(data) {
                resolve(data)
            },
            error: function(error) {
                reject(error)
            },
        });
    });

    var response = {
        http: http,
        data: null,
        party: null,
        loaded: false,
        staging: false,
        active_page: 0,
        modal: [],
        region: 'uk',
        pages: {
            data: [],
            map: function() {
                var $this = response;
                var catalogue = $this.get();
                var items = catalogue[$this.region + '_items'];
                $this.pages.data = items;
            }
        },
        set: function(data, consultant) {
            var $this = response;

            if (this.loaded) {
                return this;
            }

            if(typeof data !== 'string') {
                data = JSON.stringify(data);
            }


            if(typeof consultant == 'object' && typeof consultant.data.slug == 'string') {
                data = data.replace(/\/corp\//gm, '/' + consultant.data.slug + '/');
                data = data.replace(/\\\/corp\\\//gm, '/' + consultant.data.slug + '/');
                data = data.replace(/\/corp/gm, '/' + consultant.data.slug);
                data = data.replace(/\/corp\\\//gm, '/' + consultant.data.slug + '/');

                /*
                 * Check if there is a Party URL
                 */
                if(location.search.indexOf('?party') > -1) {
                    var party_code = location.search.replace('?party=', '');
                    if(party_code.indexOf('&') > -1) {
                        party_code = $.trim(party_code.split('&')[0]);
                    }
                    if(typeof consultant.data == 'object' && typeof consultant.data.party_links == 'object') {
                        if(typeof consultant.data.party_links[party_code] !== 'undefined') {
                            var party = consultant.data.party_links[party_code];
                            party.id = party_code;

                            delete party.bid;

                            if(typeof get_party_bid == 'undefined') {

                                function get_party_bid(party) {
                                    console.log($this);
                                    var party_session = localStorage.getItem(party.id);
                                    if(party_session == null) {
                                        $.ajax({
                                            url: api_url + 'get_party_bid',
                                            type: 'POST',
                                            data: {
                                                slug: consultant.data.slug,
                                                code: party.id
                                            },
                                        })
                                        .done(function(e) {
                                            console.log(e);
                                            if(e.success) {

                                                if(party.name) {
                                                    M.toast({
                                                        html: ('You have joined ' + party.name + '\'s Party'),
                                                        displayLength: 6000
                                                    });
                                                }

                                                party.bid = e.data.bid;
                                                $this.party.bid = e.data.bid;
                                                localStorage.setItem($this.party.id, e.data.bid);
                                                localStorage.setItem(party.id + '_timeout', ((new Date().getTime()) + 600000));
                                            } else {
                                                if(party.name) {
                                                    M.toast({
                                                        html: (party.name + '\'s Party has now expired'),
                                                        displayLength: 6000
                                                    });
                                                }
                                            }
                                        })
                                        .fail(function() {
                                            M.toast({
                                                html: ('An error occured joining Party'),
                                                displayLength: 2000
                                            });
                                        });
                                        
                                    } else {
                                        party.bid = party_session;



                                        var party_link_timeout = localStorage.getItem(party.id + '_timeout');
                                        if(party_link_timeout == null) {
                                            var now_time_p10 = (new Date().getTime()) + 600000;
                                            localStorage.setItem(party.id + '_timeout', now_time);
                                            party_link_timeout = now_time;
                                        }

                                        var now = new Date().getTime();
                                        if(now >= party_link_timeout) {
                                            localStorage.removeItem(party.id);
                                            localStorage.removeItem(party.id + '_timeout');
                                            get_party_bid(party);

                                        } else {
                                            M.toast({
                                                html: ('You have joined ' + party.name + '\'s Party'),
                                                displayLength: 6000
                                            });
                                        }


                                    }
                                }
                            }

                            get_party_bid(party);

                        }
                    }
                } else {
                    /* Get Shop BID if no party */
                    if(typeof consultant.data == 'object') {
                        var shop_bid = localStorage.getItem(consultant.data.slug + '_shop_bid');
                        if(shop_bid) {
                            $this.shop_bid = shop_bid;
                        } else {
                            $.ajax({
                                url: api_url + 'get_shop_bid',
                                type: 'POST',
                                data: {
                                    slug: consultant.data.slug,
                                },
                            })
                            .done(function(e) {
                                if(e.success && e.data.bid !== null) {
                                    localStorage.setItem(consultant.data.slug + '_shop_bid', e.data.bid);
                                    $this.shop_bid = e.data.bid;
                                }
                            })
                            .fail(function(e) {
                                console.warn('An error occured getting shop BID');
                            });
                        }
                    }
                    
                
                }

                

            }

            this.data = JSON.parse(data);

            if(typeof party !== 'undefined') {
                this.party = party;
            }

            this.loaded = true;
            this.pages.map();
            this.http = {
                then: function() {
                    $this.data.cached = true;
                    return $this.data;
                }
            };

            return this;
        },
        get: function(index) {
            var $this = response;

            if(location.host.substring(0,7) == 'staging' && !this.staging) {
                this.staging = true;
                M.toast({
                    html: ('Staging Environment'),
                    displayLength: 2000
                });
            }

            for (var i = $this.data.length - 1; i >= 0; i--) {
                var item = $this.data[i];

                if(this.staging && item.environment == 'staging' || !this.staging && item.environment == 'production') {
                    index = i;
                }
            }

            var cat = $this.data[index ? index : 0];

            if(typeof cat == 'object' && typeof cat.primary_color !== 'undefined') {
                if(cat.primary_color) {
                    $('nav.main-nav').css('background-color', cat.primary_color);
                }

                if(cat.secondary_color) {
                    $('body').css('background-color', cat.secondary_color);
                }
            }

            return cat;
        }
    };

    return response;

});