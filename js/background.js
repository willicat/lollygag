var dataAccessManager = {
  /**
   * Updates sites in local storage
   */
  update: function(key, value) {
    var dao = {};
    dao[key] = value;

    chrome.storage.local.set(dao, function() {
      // Notify that we saved.
      console.log('Saved '+dao);
    });
  },

  /**
   * Retrieves blocked sites from local storage
   */
  get: function(callback) {
    chrome.storage.local.get(['isActive', 'sites'], function(items) {
      callback(items.isActive, items.sites);
    });
  },
};

// Listen for when a tab get's updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

	dataAccessManager.get(function(isActive, sites) {
    // set data
    var isActive = isActive == undefined ? true : isActive;

    if(isActive) {
    	for(var i = 0;i < sites.length; i++) {
    		if(changeInfo.url.indexOf(sites[i].url) != -1) {
          // add attempt to sites blocked collection
          var block = {
            date: new Date().getTime()
          };

          // add to site's blocked collection
          sites[i].blocked.push(block);

          // update
          dataAccessManager.update('sites', sites);

					// if changeInfo url matches one of stored, redirect to gbtw.me
					chrome.tabs.update({ url: 'http://www.dailyinspirationalquotes.in/' });
				}
    	}
    }
  });   

});