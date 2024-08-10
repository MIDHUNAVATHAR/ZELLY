 

  const images = ['images/bannerImage/image1.jpg', 'images/bannerImage/image2.jpg', 'images/bannerImage/image3.jpg'];
  let currentIndex = 0;
  
  const bannerImage = document.getElementById('banner-image');
  const dots = document.querySelectorAll('.dot');
  
  function changeImage() {
    currentIndex = (currentIndex + 1) % images.length;
    bannerImage.src  =  images[currentIndex];
    
    dots.forEach((dot , index) => {
      if ( index === currentIndex ) { 
        dot.classList.add('dot-active');
      } else {
        dot.classList.remove('dot-active');  
      }
    });
  }
  
  setInterval(changeImage, 3000); // Change image every 3 seconds 
