const run = () => {
  const images = Array.from(document.querySelectorAll('.tier-list-table-object-image'));
  images.forEach(({ src }) => {
    const srcParts = src.split('/');
    const name = srcParts[srcParts.length - 2] + '/' + srcParts[srcParts.length - 1];
    const link = document.createElement('a');
    link.href = src;
    link.download = name;
    const evt = new MouseEvent('click', {
      'view': window,
      'bubbles': true,
      'cancelable': true
    });
    document.body.appendChild(link);
    link.dispatchEvent(evt);
    document.body.removeChild(link);
  });
};

run();