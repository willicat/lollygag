// TODO: Implement prototype.bind
// http://coding.smashingmagazine.com/2014/01/23/understanding-javascript-function-prototype-bind/

chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (key in changes) {
    var storageChange = changes[key];
    console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
  } 
});

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

/**
 * Control interactions between the model and the view
 */
var controller = {

}

/**
 * Control interactions between the model and the view
 */
var view = {
  // controls
  addSiteButton: document.getElementById('addSiteButton'),
  isActiveButton: document.getElementById('isActiveButton'),

  // data
  sites: null,
  isActive: null,

  /**
   * Initialize the view, load in saved user defaults
   */
  setup: function(callback) {
    var obj = view; // set so callback can reference

    dataAccessManager.get(function(isActive, sites) {

      var sitesContainer = document.getElementById('sitesContainer'),
        siteUrlInput = document.getElementById('siteUrlInput'),
        isActiveButton = document.getElementById('isActiveButton');

      // set data
      obj.isActive = isActive == undefined ? true : isActive;
      obj.sites = sites;

      if (obj.sites == undefined)
        obj.sites = [];

      // wire button handlers
      this.addSiteButton.onclick = function(event) {
        obj.addSiteToPanel();
      };

      this.isActiveButton.onclick = function(event) {
        obj.toggleIsActive();
      }

      // if extension is active, build out sites
      if(obj.isActive) {
        obj.render();
      } 
      else {
        isActiveButton.innerHTML = '<span class="glyphicon glyphicon-off"></span> Turn on';
        sitesContainer.style.display = 'none';
        isActiveButton.classList.remove('btn-warning');
        isActiveButton.classList.add('btn-success');
      }
    });    
  },

  render: function() {
    var obj = view; // set so callback can reference
    var listGroupSites = document.getElementById('listGroupSites'),
      sitesCount = document.getElementById('sitesCount');

    // clear preloaded sites
    listGroupSites.innerHTML = '';
    sitesCount.innerHTML = '';

    if(obj.sites != undefined) {
      sitesCount.innerHTML = '('+obj.sites.length+')';

      for (var i = 0; i < obj.sites.length; i++) {  
        var site_el = document.createElement('li');

        // add class
        site_el.className = 'list-group-item';

        // add innerHTML
        site_el.innerHTML = '<strong>'+obj.sites[i].url+'</strong>';

        // add child remove button
        var remove_btn = document.createElement('button');

        remove_btn.className = 'btn btn-xs btn-warning pull-right';
        remove_btn.setAttribute('data-row' , i);
        remove_btn.innerHTML = 'Remove';

        // bind event
        remove_btn.onclick = function(event) {
          // remove el from array
          obj.sites.splice(this.getAttribute('data-row'), 1);

          // update
          dataAccessManager.update('sites', obj.sites);

          // render
          obj.render();
        };

        site_el.appendChild(remove_btn);

        // add blocked count and last attempt timestamp
        if(obj.sites[i].blocked.length > 0) {
          // grab last block attempt timestamp
          var date = new Date(obj.sites[i].blocked[obj.sites[i].blocked.length - 1].date);

          var blocked_container = document.createElement('small');

          blocked_container.innerHTML = '<br>'+obj.sites[i].blocked.length+' block(s) | Last attempt: '+date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

          site_el.appendChild(blocked_container);
        }

        listGroupSites.appendChild(site_el);        
      }
    }
  },

  addSiteToPanel: function() {

    var obj = view; // set so callback can reference

    var errorDiv = document.getElementById('errorDiv');
    var value = document.getElementById('siteUrlInput').value;

    // validate
    if(value.length < 5) {
      errorDiv.innerHTML = 'Please provide a site';
      errorDiv.style.display = 'block';
    } 
    else if (!value.match(/^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/i)) {
      errorDiv.innerHTML = 'Your site name doesn\'t look right.  Please make it follows the format of <em>name.com</em>.';
      errorDiv.style.display = 'block';
    }
    else if (obj.sites.indexOf(value) != -1) {
      errorDiv.innerHTML = 'This site is already in user.';
      errorDiv.style.display = 'block';
    }
    else {
      errorDiv.style.display = 'none';
    }

    if(errorDiv.style.display != 'block') {
      // create JS obj
      var site = {
        url: value, // site url
        blocked: [] // collection storing each attempt
      };

      // add to sites
      obj.sites.push(site);

      // update 
      dataAccessManager.update('sites', obj.sites);

      // render
      obj.render();

      // clear input
      document.getElementById('siteUrlInput').value = '';
    }
  },

  toggleIsActive: function() {

    var obj = view;

    var sitesContainer = document.getElementById('sitesContainer'),
        isActiveButton = document.getElementById('isActiveButton');

    if(obj.isActive) {
      obj.isActive = false;

      isActiveButton.innerHTML = '<span class="glyphicon glyphicon-off"></span> Turn on';
      isActiveButton.classList.remove('btn-warning');
      isActiveButton.classList.add('btn-success');

      sitesContainer.style.display = 'none';
    }
    else {
      obj.isActive = true;

      isActiveButton.innerHTML = '<span class="glyphicon glyphicon-off"></span> Turn off';
      isActiveButton.classList.remove('btn-success');
      isActiveButton.classList.add('btn-warning');

      sitesContainer.style.display = 'block';

      // render
      obj.render();
    }

    // update
    dataAccessManager.update('isActive', obj.isActive);    

  }
}

// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
  view.setup();
});
