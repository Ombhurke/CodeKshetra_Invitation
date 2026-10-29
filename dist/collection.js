/* The collection is deliberately buildless and has no external requests. */
document.querySelectorAll('.design-card').forEach((card, index) => {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    card.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],
      {duration:650,delay:index*100,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
  }
});
