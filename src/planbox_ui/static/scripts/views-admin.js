/*globals Backbone jQuery Handlebars Modernizr _ Pen */

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

    // Handlebars support for Marionette
  Backbone.Marionette.TemplateCache.prototype.compileTemplate = function(rawTemplate) {
    return Handlebars.compile(rawTemplate);
  };

  // Admin ====================================================================
  NS.ContentEditableMixin = {
    handleEditableBlur: function(evt) {
      var $target = $(evt.target),
          attr = $target.attr('data-attr'),
          val = $target.html();

      evt.preventDefault();

      // Set the value of what was just blurred. Setting an event to the same
      // value does not trigger a change event.
      this.model.set(attr, val);
    },
    initPen: function(el) {
      this.pen = new Pen({
        editor: el,
        list: ['insertorderedlist', 'insertunorderedlist', 'bold', 'italic', 'createlink'],
        stay: false
      });
    }
  };

  NS.showErrorModal = function(resp) {
    var statusCode = resp.status,
        respJSON = resp.responseJSON,
        title, subtitle, description;

    ////
    // TODO: We can have a single subtitle template and a description template
    //       for ajax errors, and then pass in a status code.
    ////
    title = 'Unable to save.';
    if (statusCode === 0) {
      // No network connectivity
      subtitle = Handlebars.templates['message-ajax-no-status-error-subtitle']({});
      description = Handlebars.templates['message-ajax-no-status-error-description']({});

    } else if (statusCode === 400) {
      // Bad request (missing title, at this point)
      subtitle = Handlebars.templates['message-ajax-bad-request-error-subtitle']({errors: respJSON});
      description = Handlebars.templates['message-ajax-bad-request-error-description']({errors: respJSON});

    } else if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
      // Authentication error
      // NOTE: you get a 404 when trying to access a private project, which
      // could belong to the user but they're now signed out for some reason.
      subtitle = Handlebars.templates['message-ajax-authentication-error-subtitle']({});
      description = Handlebars.templates['message-ajax-authentication-error-description']({});

    } else if (statusCode >= 500) {
      // Unknown server error
      subtitle = Handlebars.templates['message-ajax-server-error-subtitle']({});
      description = Handlebars.templates['message-ajax-server-error-description']({});

    } else {
      // No idea
      subtitle = Handlebars.templates['message-ajax-unknown-error-subtitle']({});
      description = Handlebars.templates['message-ajax-unknown-error-description']({});
    }

    NS.app.overlayRegion.show(new NS.ModalView({
      model: new Backbone.Model({
        title: title,
        subtitle: subtitle,
        description: description
      })
    }));
  };

  NS.ProjectAdminModalView = Backbone.Marionette.ItemView.extend({
    template: '#project-admin-modal-tpl',
    className: 'overlay',
    ui: {
      closeBtn: '.btn-close',
      publishBtn: '.btn-public',
      makePublicContent: '.make-public-content',
      shareContent: '.share-content'
    },
    events: {
      'click @ui.closeBtn': 'handleClose',
      'click @ui.publishBtn': 'handlePublish'
    },
    handleClose: function(evt) {
      evt.preventDefault();
      this.close();
    },
    handlePublish: function(evt) {
      var self = this;

      evt.preventDefault();

      this.model.save({public: true}, {
        // We are not interested in change events that come from the server,
        // and it causes the save button to enable after saving a new project
        silent: true,

        success: function() {
          self.ui.makePublicContent.addClass('is-hidden');
          self.ui.shareContent.removeClass('is-hidden');
        },
        error: function(model, resp) {
          NS.showErrorModal(resp);
        }
      });
    }
  });

  NS.ProjectAdminView = Backbone.Marionette.CompositeView.extend({
    template: '#project-admin-tpl',
    itemViewContainer: '#section-list',
    ui: {
      editables: '[contenteditable]:not(.event [contenteditable])',
      saveBtn: '.save-btn',
      statusSelector: '.status-selector',
      statusLabel: '.project-status',
      visibilityToggle: '[name=project-public]',
      userMenuLink: '.user-menu-link',
      userMenu: '.user-menu',
      publishBtn: '.btn-public'
    },
    events: {
      'blur @ui.editables': 'handleEditableBlur',
      'change @ui.statusSelector': 'handleStatusChange',
      'change @ui.visibilityToggle': 'handleVisibilityChange',
      'click @ui.saveBtn': 'handleSave',
      'click @ui.userMenuLink': 'handleUserMenuClick',
      'click @ui.publishBtn': 'handlePublish'
    },
    modelEvents: {
      'change': 'dataChanged',
      'sync': 'onSync'
    },
    collectionEvents: {
      'change':  'dataChanged',
      'add':     'dataChanged',
      'remove':  'dataChanged',
      'reorder': 'dataChanged'
    },
    initialize: function() {
      // Hijack paste and strip out the formatting
      this.$el.on('paste', '[contenteditable]', function(evt) {
        evt.preventDefault();

        var pasted;
        // WebKit and FF
        if (evt && evt.originalEvent && evt.originalEvent.clipboardData &&
            evt.originalEvent.clipboardData.getData) {
          // This preserves line breaks, so don't worry about getting the HTML
          pasted = evt.originalEvent.clipboardData.getData('text/plain');
        } else if (window.clipboardData && window.clipboardData.getData)  {
          // IE
          pasted = window.clipboardData.getData('Text');
        }

        // Convert line breaks into <br> and paste
        NS.Utils.pasteHtmlAtCaret(pasted.replace(/\n/g, '<br>'));
      });
    },
    onRender: function() {
      this.$('.project-description').each(function(i, el) {
        NS.ContentEditableMixin.initPen(el);
      });
    },
    onSync: function() {
      // When the model is synced with the server, we're going to rerender
      // the view to match the data.
      this.render();
    },
    handleEditableBlur: NS.ContentEditableMixin.handleEditableBlur,
    handleStatusChange: function(evt) {
      var $target = $(evt.target),
          attr = $target.attr('data-attr'),
          val = $target.val();

      evt.preventDefault();

      this.ui.statusLabel
        // .removeClass('project-status-not-started project-status-active project-status-complete')
        // .addClass('project-status-'+val)
        .find('strong').text(_.findWhere(NS.Data.statuses, {'value': val}).label);

      this.model.set(attr, val);
    },
    handleVisibilityChange: function(evt) {
      var $target = $(evt.target),
          attr = $target.attr('data-attr'),
          val = ($target.val() === 'true');

      evt.preventDefault();

      // For IE8 only
      this.ui.visibilityToggle.removeClass('checked');
      $target.addClass('checked');

      this.model.set(attr, val);
    },
    save: function(makePublic) {
      var self = this,
          data = null;

      if (makePublic) {
        data = {public: true};
      }

      this.model.clean();
      this.model.save(data, {
        // We are not interested in change events that come from the server,
        // and it causes the save button to enable after saving a new project
        silent: true,
        success: function(model) {
          var path = '/' + NS.Data.user.username + '/' + model.get('slug') + '/';

          if (window.location.pathname !== path) {
            if (Modernizr.history) {
              window.history.pushState('', '', path);
            } else {
              window.location = path;
            }
          }

          if (makePublic || !model.get('public')) {
            // Show the modal if we're publishing this right now
            NS.app.overlayRegion.show(new NS.ProjectAdminModalView({
              model: model
            }));
          }
        },
        error: function(model, resp) {
          NS.showErrorModal(resp);
        }
      });
    },
    handleSave: function(evt) {
      evt.preventDefault();
      var self = this,
          $target = $(evt.target);

      if (!$target.hasClass('btn-disabled')) {
        this.save();
      }
    },
    handlePublish: function(evt) {
      evt.preventDefault();
      this.save(true);
    },
    handleUserMenuClick: function(evt) {
      evt.preventDefault();
      this.ui.userMenu.toggleClass('is-open');
    },
    dataChanged: function() {
      // Show the save button
      this.ui.saveBtn.removeClass('btn-disabled');
    },

    getItemViewOptions: function(item, index) {
      var type = item.get('type'),
          options = {parent: this};

      if (type === 'timeline') {
        options.collection = this.model.get('events');
      }

      return options;
    },
    getItemView: function(item) {
      var type = item.get('type'),
          SectionView;

      if (type === 'timeline') {
        SectionView = NS.TimelineAdminView;
      }

      return SectionView;
    }
  });

  // Sections =================================================================
  NS.SectionAdminMixin = {
    id: function() {
      return this.model.get('slug');
    }
  };

  NS.EventAdminView = Backbone.Marionette.ItemView.extend({
    template: '#event-admin-tpl',
    tagName: 'li',
    className: 'event',
    ui: {
      editables: '[contenteditable]',
      deleteBtn: '.delete-event-btn'
    },
    events: {
      'blur @ui.editables': 'handleEditableBlur',
      'click @ui.deleteBtn': 'handleDeleteClick'
    },
    initialize: function() {
      this.$el.attr('data-id', this.model.cid);
    },
    handleEditableBlur: NS.ContentEditableMixin.handleEditableBlur,
    handleDeleteClick: function(evt) {
      evt.preventDefault();

      if (window.confirm('Really delete?')) {
        // I know this is weird, but calling destroy on the model will sync,
        // and there's no url to support that since it's related to the project
        // model. So we're just going to do the remove directly.
        this.model.collection.remove(this.model);
      }
    },
    onRender: function() {
      this.$('.event-description').each(function(i, el) {
        NS.ContentEditableMixin.initPen(el);
      });
    }
  });

  NS.TimelineAdminView = Backbone.Marionette.CompositeView.extend({
    template: '#timeline-section-admin-tpl',
    tagName: 'section',
    className: 'project-timeline',
    id: NS.SectionAdminMixin.id,
    
    itemView: NS.EventAdminView,
    itemViewContainer: '.event-list',

    ui: {
      editables: '[contenteditable]:not(.event [contenteditable])',
      addBtn: '.add-event-btn'
    },
    events: {
      'click @ui.addBtn': 'handleAddClick'
    },
    collectionEvents: {
      'change':  'dataChanged',
      'add':     'dataChanged',
      'remove':  'dataChanged',
      'reorder': 'dataChanged'
    },
    onRender: function() {
      var self = this;

      this.$('.event-list').sortable({
        handle: '.handle',
        update: function(evt, ui) {
          var id = $(ui.item).attr('data-id'),
              model = self.collection.get(id),
              index = $(ui.item).index();

          // Silent because we don't want the list to rerender
          self.collection.moveTo(model, index);
        }
      });
    },
    handleAddClick: function(evt) {
      evt.preventDefault();

      this.collection.add({});

      this.$('.event-title.content-editable').focus();
    },
    dataChanged: function() {
      this.options.parent.dataChanged();
    },
  });

}(Planbox, jQuery));