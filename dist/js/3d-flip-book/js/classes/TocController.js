import WidgetController from 'WidgetController';

export default class TocController extends WidgetController {

  constructor(view, bookCtrl) {
    super(view, 'widFloatWnd');
    this.bookCtrl = bookCtrl;
    this.tab = 'none';
  }

  setThumbnails(thumbnails) {
    this.thumbnails = thumbnails;
    thumbnails.onNavigate = this.navigateThumbnails.bind(this);
    if(this.tab === 'none') {
      this.tab = 'thumbnails';
    }
    this.fireChange();
  }

  setSearch(search) {
    this.search = search;
    search.onNavigate = this.navigateSearch.bind(this);
    this.fireChange();
  }

  setBookmarks(bookmarks, pdf) {
    this.bookmarks = bookmarks;
    this.pdf = pdf;
    bookmarks.onNavigate = this.navigateBookmarks.bind(this);
    if(bookmarks.getSize()) {
      this.tab = 'bookmarks';
      this.isBookmarks = true;
    }
    this.fireChange();
  }

  cmdBookmarks() {
    this.tab = 'bookmarks';
    this.fireChange();
  }

  cmdThumbnails() {
    this.tab = 'thumbnails';
    this.fireChange();
  }

  cmdSearch() {
    this.tab = 'search';
    this.fireChange();
  }

  cmdCloseToc() {
    this.hide();
  }

  navigateThumbnails(number) {
    this.bookCtrl.goToPage(number);
  }

  navigateSearch(number) {
    this.bookCtrl.goToPage(number);
  }

  navigateBookmarks(item) {
    if(item.url) {
      window.open(item.url, '_blank');
    }
    else if(item.dest) {
      this.pdf.getDestination(item.dest).
        then((number)=> this.bookCtrl.goToPage(number));
    }
  }

  updateView() {
    if(this.view) {
      this.view.setState('widTocMenu', {
        enable: true,
        visible: true,
        active: false
      });
      this.view.setState('widThumbnails', {
        enable: true,
        visible: this.tab==='thumbnails',
        active: false
      });
      this.view.setState('widSearch', {
        enable: true,
        visible: this.tab==='search',
        active: false
      });
      this.view.setState('widBookmarks', {
        enable: true,
        visible: this.tab==='bookmarks',
        active: false
      });
      this.view.setState('cmdBookmarks', {
        enable: true,
        visible: true,
        active: this.tab==='bookmarks'
      });
      this.view.setState('cmdCloseToc', {
        enable: true,
        visible: true,
        active: false
      });
      this.view.setState('cmdThumbnails', {
        enable: true,
        visible: true,
        active: this.tab==='thumbnails'
      });
      this.view.setState('cmdSearch', {
        enable: true,
        visible: true,
        active: this.tab==='search'
      });
      Promise.resolve().then(()=> this.thumbnails.setEnable(this.visible && this.tab==='thumbnails'));
      super.updateView();
    }
  }

}
