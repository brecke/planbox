/*globals Backbone jQuery Handlebars Modernizr _ Pen Shareabouts*/

var Planbox = Planbox || {};

(function(NS, $) {
  'use strict';

    // Handlebars support for Marionette
  Backbone.Marionette.TemplateCache.prototype.compileTemplate = function(rawTemplate) {
    return Handlebars.compile(rawTemplate);
  };

  // Sections =================================================================
  NS.AttachmentView = Backbone.Marionette.Layout.extend({
    template: '#attachment-tpl',
    tagName: 'li',
    className: 'attachment',
  });

  NS.AttachmentListView = Backbone.Marionette.CompositeView.extend({
    template: '#attachments-section-tpl',
    itemView: NS.AttachmentView,
    itemViewContainer: '.attachment-list'
  });

  NS.EventView = Backbone.Marionette.Layout.extend({
    template: '#event-tpl',
    tagName: 'li',
    className: 'event',
    regions: {
      attachmentList: '.attachments-region'
    },
    onRender: function() {
      this.attachmentList.show(new NS.AttachmentListView({
        model: this.model,
        collection: this.model.get('attachments')
      }));
    }
  });

  NS.TimelineSectionView = Backbone.Marionette.CompositeView.extend({
    template: '#timeline-section-tpl',
    tagName: 'section',
    className: 'project-section-timeline',

    itemView: NS.EventView,
    itemViewContainer: '.event-list'
  });

  NS.TextSectionView = Backbone.Marionette.ItemView.extend({
    template: '#text-section-tpl',
    tagName: 'section',
    className: 'project-section-text'
  });

  NS.FaqView = Backbone.Marionette.ItemView.extend({
    template: '#faq-tpl',
    tagName: 'div',
    className: 'faq',
    ui: {
      'question': 'dt'
    },
    events: {
      'click @ui.question': 'handleQuestionClick'
    },

    handleQuestionClick: function(evt) {
      evt.preventDefault();
      this.ui.question.toggleClass('is-selected');
    }
  });

  NS.FaqsSectionView = Backbone.Marionette.CompositeView.extend({
    template: '#faqs-section-tpl',
    tagName: 'section',
    className: 'project-section-faqs',

    itemView: NS.FaqView,
    itemViewContainer: '.faq-list'
  });

  NS.ShareaboutsSectionView = Backbone.Marionette.ItemView.extend({
    template: '#shareabouts-section-tpl',
    tagName: 'section',
    className: 'project-section-shareabouts',
    ui: {
      shareabouts: '.project-shareabouts'
    },
    onShow: function() {
      var details = this.model.get('details');

      new Shareabouts.Map({
        el: this.ui.shareabouts,
        map: details.map,
        layers: details.layers,
        placeStyles: [
          {
            condition: 'true',
            icon: {
              iconUrl: NS.bootstrapped.staticUrl + 'images/markers/dot-blue.png',
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            },
            focusIcon: {
              iconUrl: NS.bootstrapped.staticUrl + 'images/markers/marker-blue.png',
              shadowUrl: NS.bootstrapped.staticUrl + 'images/markers/marker-shadow.png',
              iconSize: [25, 41],
              shadowSize: [41, 41],
              iconAnchor: [12, 41]
            }
          },
        ],
        datasetUrl: details.dataset_url + '/places',
        templates: Handlebars.templates
      });

    }
  });

  // View =====================================================================
  NS.ModalView = Backbone.Marionette.ItemView.extend({
    template: '#modal-tpl',
    className: 'reveal-modal medium',
    attributes: {
      'data-reveal': ''
    },
    onShow: function() {
      // This is gross. We should encourage Foundation to fix this.
      this.$el.foundation().foundation('reveal', 'open');
    },
    onClose: function() {
      // This is gross. We should encourage Foundation to fix this.
      this.$el.foundation().foundation('reveal', 'close');
    }
  });

  NS.ProjectSectionListView = NS.BaseProjectSectionListView.extend({
    sectionViews: {
      'timeline': NS.TimelineSectionView,
      'text': NS.TextSectionView,
      'faqs': NS.FaqsSectionView,
      'shareabouts': NS.ShareaboutsSectionView
    }
  });

  NS.ProjectView = NS.BaseProjectView.extend({
    template: '#project-tpl',
    sectionListView: NS.ProjectSectionListView
  });


}(Planbox, jQuery));