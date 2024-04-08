var getUrl = window.location;
var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
var leaveEventNum = 0;
var leaveEvent;

function applyVue() {

    Vue.component('cancelation-headers', {
        props: ['subHeaders'],
        template: '<h2>{{subHeaders}}</h2>'
    })

    var page = new Vue({
        el: '#cancelation-flow',
        data: {
            user_data,
            mobileMenu: "settings",
            slide: 0,
            popUpSlide: 8,
            previouslyVisitedReasonSlide: 0,
            content,
            cancelSliderValue: 1,
            showCancelationPopUp: false,
            scrollPosition: null,
            prevent: false,
            ...popUpMethods,
            ...helperMethods,
        }, 
        watch: {
            cancelSliderValue: function() {
                let sliderImage = document.getElementById('slider-image');
                let contextCanvas = sliderImage.getContext("2d");
                let img = new Image();
                img.onload = drawImageActualSize;

                requestAnimationFrame(() =>  {
                    if (page.cancelSliderValue > 20 && page.cancelSliderValue <= 42 || page.cancelSliderValue > 52 && page.cancelSliderValue <= 121) {
                        img.src = "/images/users/account-settings/Cancelation-flow-slide/Scene_" + page.cancelSliderValue + ".jpg";
                        contextCanvas.drawImage(img, 0, 0);

                        if (page.cancelSliderValue == 121) {
                            page.showCancelationPopUp = true;
                            page.popUpSlide = 8;
                            page.showCancelationPopUp;
                        } else {
                            page.showCancelationPopUp = false;
                        }

                    } else if (page.cancelSliderValue > 1 && page.cancelSliderValue <= 20 || page.cancelSliderValue > 43 && page.cancelSliderValue <= 52) {
                        img.src = "/images/users/account-settings/Cancelation-flow-slide/Scene_" + page.cancelSliderValue + ".png";
                        contextCanvas.drawImage(img, 0, 0);
                    }
                })
                
                function drawImageActualSize() {
                    sliderImage.width = this.naturalWidth;
                    sliderImage.height = this.naturalHeight;
                    contextCanvas.drawImage(this, 0, 0);
                    contextCanvas.drawImage(this, 0, 0, this.width, this.height);
                }

            }, 
            showCancelationPopUp: function() {
                if (page.showCancelationPopUp) {
                    page.scrollPosition = window.pageYOffset;
                    document.getElementById('to-freeze').style.overflow = "hidden";
                    document.getElementById('to-freeze').style.position = "fixed";
                    document.getElementById('to-freeze').style.top = -(page.scrollPosition - 100)+'px';
                    document.getElementById('to-freeze').style.width = "100%";
                    window.scrollTo(0,0);
                }
            },
            content : {
                handler: function() {
                    let storedForm = this.openStorage()
                    if (!storedForm) storedForm = {}
                    storedForm['content'] = page.content
                    this.saveStorage(storedForm) 
                },
                deep: true
            },
            slide : {
                handler: function() {
                    window.scrollTo(0, 0);
                    let storedForm = this.openStorage()
                    if (!storedForm) storedForm = {}
                    storedForm['slide'] = page.slide
                    storedForm['previouslyVisitedReasonSlide'] = page.previouslyVisitedReasonSlide
                    this.saveStorage(storedForm) 
                }, 
                deep: true
            }, 
        },
        methods: {
            openStorage: function () {
                return JSON.parse(sessionStorage.getItem('page'))
            },
            saveStorage: function (page) {
                sessionStorage.setItem('page', JSON.stringify(page))
            },
            init: function () {
                $('.mobileSelect').selectpicker();
                this.cancelationActionLog()
                const storedForm = this.openStorage()
                if (storedForm && storedForm['slide']) {
                    page.slide = storedForm['slide']
                } 
                if (storedForm && storedForm['content']) {
                    for (let slide in storedForm['content']) {
                        if (storedForm['content'][slide]['checked'] >= 0) {
                            page.content[slide]['checked'] = storedForm['content'][slide]['checked'];
                        }
                        if (storedForm['content'][slide]['reasons']) {
                            for (i = 0; i < storedForm['content'][slide]['reasons'].length; i++) {
                                page.content[slide]['reasons'][i]['checked'] = storedForm['content'][slide]['reasons'][i]['checked'];
                            }
                        }
                        if (storedForm['content'][slide]['input']) {
                            page.content[slide]['input'] = storedForm['content'][slide]['input']
                        }
                    }
                }
                if (storedForm && storedForm['previouslyVisitedReasonSlide']) {
                    page.previouslyVisitedReasonSlide = storedForm['previouslyVisitedReasonSlide']
                }
            },
            storageReset: function() {
                let storedForm = this.openStorage()
                if (!storedForm) storedForm = {}
                let data = null
                storedForm = data
                this.saveStorage(storedForm) 
            },
            cancelationActionLog: function (slide, slideContent) {
                $.ajax({
                    url: baseUrl + '/users/cancelationActionLog',
                    type: "POST",
                    data: {
                        user_id: page.user_data.user_id,
                        subscription_id: page.user_data.subscription_id,
                        slide: slide,
                        checkbox: slideContent ? page.content[slideContent]['checked'] : null,
                        input: slideContent ? page.content[slideContent]['input'] : null,
                    },
                    dataType: 'json',
                    success: (response) => {
                        if(response.success) {
                            // page.slide = 7; 
                            // page.hideCancelationPopUp(); 
                            console.log(response.success);
                        } else {
                            // response.message && errorMessage(response.message);
                            console.log(response.message);
                        }
                    }
                });
            },
            cancelationUserNotes: function (slideContent) {
                context_info = '';
                if (slideContent === 'slide5content') {
                    context_info = 'What did we get right?';
                } else {
                    context_info = slideContent ? page.content[slideContent]['reasons'][page.content[slideContent]['checked']]['reason'] : null;
                }

                $.ajax({
                    url: baseUrl + '/users/cancelationUserNotes',
                    type: "POST",
                    data: {
                        user_id: page.user_data.user_id,
                        context_info: context_info,
                        note: slideContent ? page.content[slideContent]['input'] : null,
                    },
                    dataType: 'json',
                    success: (response) => {
                        if(!response.success) {
                            console.log(response.message);
                        }
                    }
                });
            },
            cancelationActionLogPopUp: function (retention) {
                // An argument 3 = the user left the cancelation flow without cancelling 
                // An argument 2 = the user left the cancelation flow to change their subscription 
                // An argument 1 = the user left the pop-up and returned to the cancelation flow
                // An argument 0 = the user officially canceled via the last cancelation flow pop-up 
                $.ajax({
                    url: baseUrl + '/users/cancelationActionLog',
                    type: "POST",
                    data: {
                        user_id: page.user_data.user_id,
                        subscription_id: page.user_data.subscription_id,
                        slide: page.popUpSlide,
                        checkbox: retention
                    },
                    dataType: 'json',
                    success: (response) => {
                        if(response.success) {
                            // page.hideCancelationPopUp(); 
                            console.log(response.success);
                        } else {
                            // response.message && errorMessage(response.message);
                            console.log(response.message);
                        }
                    }
                });
            },
            checkbox: function(key, slide, checked) {
                const array = [0, 1, 2, 3];
                array.splice(key, 1);
                array.forEach (num => {
                    page.content[slide].reasons[num].checked = false;
                });
                page.content[slide].reasons[key].checked = true;
                page.content[slide].checked = key;
                if (checked == true) {
                    page.content[slide].checked = -1;
                }
            }, 
            changeSlide: function(key) {
                if (key == 0) {
                    page.slide = 1;
                } else if (key == 1) {
                    page.slide = 2;
                } else if (key == 2) {
                    page.slide = 3;
                } else if (key == 3) {
                    page.slide = 4;
                }
            }, 
            hideCancelationPopUp: function() {
                document.getElementById('to-freeze').style.removeProperty("overflow");
                document.getElementById('to-freeze').style.removeProperty("position");
                document.getElementById('to-freeze').style.removeProperty("top");
                document.getElementById('to-freeze').style.removeProperty("width");
                $(document).scrollTop(page.scrollPosition)

                page.showCancelationPopUp = false;
                page.cancelSliderValue = 1;
                leaveEventNum = 0;
            }, 
            cancelSubscription: function (retention) {
                let slide = "slide" + page.previouslyVisitedReasonSlide + "content";
                page.prevent = true;
                $.ajax({
                    url: baseUrl + '/users/cancelSubscription',
                    type: "POST",
                    data: {
                        user_id: page.user_data.user_id,
                        cancelation: {
                            retained: retention,
                            reason: page.content[slide].checked > -1 ? page.content[slide].cancelation_reasons[page.content[slide].checked] : null,
                            // note: page.content[slide].input,
                            charging_total: page.user_data.user_credits < 0 ? page.user_data.user_credits_formatted : page.user_data.zero_amount,
                            selfCancelation: true,
                        },
                    },
                    dataType: 'json',
                    success: (response) => {
                        if(response.success) {

                            if (retention == 0) {
                                try {trackCancelAccountSuccess(); } catch(e) { console.log('event not sent') }
                                page.hideCancelationPopUp(); 
                                page.slide = 7; 
                            } else if (retention == 1) {
                                window.location = '/account'
                            }

                        } else {
                            page.hideCancelationPopUp();
                            response.message && errorMessage(response.message);
                        }
                        page.prevent = false;
                    }, error: () => {
                        page.prevent = false;
                    }
                });
            }, 
            finalNotificationSettings: function () {
                $.ajax({
                    url: baseUrl + '/users/finalNotificationSettings',
                    type: "POST",
                    data: {
                        user_id: page.user_data.user_id,
                        notification: page.content.slide7content.checked,
                    },
                    dataType: 'json',
                    success: (response) => {
                        if(response.success) {
                            window.location = '/account'
                        } else {
                            response.message && errorMessage(response.message);
                        }
                    }
                });
            },
            redirectAccountSettings: function (location) {
                window.location = '/account#'+location;
            },
            switchAccountsWeeklySub: function() {
                page.storageReset();
                page.hideCancelationPopUp();
                popSubFilter('.weekly-desc', true)
            }
        }, 
        mounted: function() 
            {this.$nextTick(function () {
                this.init()
            })
        }
    })

    $(document).ready(function() {
        try { trackCancelAccountStart(); } catch(e) {}
        $('#cancelation-flow').removeClass('hidden');

        // If the page is reloaded, the textarea should conform to the text
        if (document.getElementsByClassName('cancelation-text-input').length > 0) {
            let element = document.getElementsByClassName('cancelation-text-input')[0].id;
            let elementTextareaHeight = document.getElementById(element).scrollHeight;
            document.getElementById(element).style.height = elementTextareaHeight+"px";
        }

        // On backspace and on input, the text area should contract or expand
        document.addEventListener('keyup', (event) => {
            let element = document.getElementsByClassName('cancelation-text-input');
            if (element[0].scrollHeight > 100) { // The textarea should not decrease 100px, 90 because otherwise it's choppy 
                document.getElementById(element[0].id).style.height = element[0].scrollHeight+"px";
            }
            if (document.getElementById(element[0].id).value.length == 0) {
                document.getElementById(element[0].id).style.height = 100+"px";
            }
        })
        // On copy paste, the text area should contract or expand
        document.addEventListener('paste', (event) => {
            let element = document.getElementsByClassName('cancelation-text-input');
            if (element[0].scrollHeight > 100) {
                document.getElementById(element[0].id).style.height = element[0].scrollHeight+"px";
            }
        })

        document.addEventListener('click', (event) => {
            let clickedElement = event.target;
            const menuMobileSection = document.getElementById('mobile-menu');
            const menuDesktopSection = document.getElementById('side-menu');
            const headerSection = document.getElementById('v2-header')
            const languageChange = (clickedElement.text == "EN" || clickedElement.text == "FR");

            // On change of page, this should adjust to any textarea on the page, and it should also adjust the text area if checkbox changes 
            let element = document.getElementsByClassName('cancelation-text-input');
            if (document.getElementsByClassName('cancelation-text-input').length > 0) {
                let elementTextareaHeight = document.getElementById(element[0].id).scrollHeight;
                if (document.getElementById(element[0].id).value.length == 0) {
                    document.getElementById(element[0].id).style.height = 100+"px";
                } else if (element[0].offsetHeight > 100) {
                    document.getElementById(element[0].id).style.height = elementTextareaHeight+"px";
                } 
            }

            do {
                if ((clickedElement == menuMobileSection || clickedElement == menuDesktopSection || clickedElement == headerSection) && !languageChange) {
                    page.storageReset();
                } 
                clickedElement = clickedElement.parentNode;
            } while (clickedElement);

            // Used for pop-ups 9 and 10 (which aren't being used)

            /*
            if (leaveEventNum == 0) {
                if (clickedElement.tagName == 'IMG') {
                    leaveEvent = clickedElement.parentNode
                } else {
                    leaveEvent = clickedElement
                }
            }

            do {
                if (((clickedElement == menuMobileSection || clickedElement == menuDesktopSection || clickedElement == headerSection) && page.slide != 7) && !languageChange) {
                    event.preventDefault();
                    page.showCancelationPopUp = true;
                    page.popUpSlide = 10;
                    leaveEventNum ++ 
                } else if ((clickedElement == menuMobileSection || clickedElement == menuDesktopSection || clickedElement == headerSection) && page.slide == 7 && !languageChange) {
                    page.finalNotificationSettings();
                    page.storageReset();
                }
                clickedElement = clickedElement.parentNode;
            } while (clickedElement);
            */
        })

        /*
        $("#leave-flow").click(function() {
            page.storageReset();

            if (leaveEvent.href) {
                window.location = leaveEvent.href
            } else {
                window.location = '/account'
            }
            
        }) 

        $("#leave-flow-account").click(function() {
            page.storageReset();
            window.location = '/account'
        })
        */
    });
}
