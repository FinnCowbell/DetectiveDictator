export default function getTitle() {
  /* I have multiple URLS that redirect to the same app.
     This is to experiment with changing the title depending on which URL you use. 
     For now, we're going to switch to Secret Hitler full-time.
     */
  if (true || document.location.href.search("hitler") > -1) {
    return "Secret Hitler!";
  } else {
    return "Detective Dictator!";
  }
}
