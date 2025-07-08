import { 
  faRobot, 
  faUser, 
  faUserTie, 
  faHeadset, 
  faCog, 
  faLightbulb, 
  faHeart, 
  faStar, 
  faThumbsUp, 
  faShield, 
  faGraduationCap, 
  faBriefcase, 
  faHome, 
  faPhone, 
  faEnvelope,
  faComment,
  faComments,
  faInfoCircle,
  faQuestionCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';

// Avatar icon options for Font Awesome
export const avatarIcons = [
  { id: 'robot', icon: faRobot, label: 'Robot' },
  { id: 'user', icon: faUser, label: 'User' },
  { id: 'user-tie', icon: faUserTie, label: 'Professional' },
  { id: 'headset', icon: faHeadset, label: 'Support Agent' },
  { id: 'cog', icon: faCog, label: 'Technical' },
  { id: 'lightbulb', icon: faLightbulb, label: 'Ideas' },
  { id: 'heart', icon: faHeart, label: 'Friendly' },
  { id: 'star', icon: faStar, label: 'Premium' },
  { id: 'thumbs-up', icon: faThumbsUp, label: 'Helpful' },
  { id: 'shield', icon: faShield, label: 'Security' },
  { id: 'graduation-cap', icon: faGraduationCap, label: 'Education' },
  { id: 'briefcase', icon: faBriefcase, label: 'Business' },
  { id: 'home', icon: faHome, label: 'Home' },
  { id: 'phone', icon: faPhone, label: 'Contact' },
  { id: 'envelope', icon: faEnvelope, label: 'Messages' },
  { id: 'comment', icon: faComment, label: 'Chat' },
  { id: 'comments', icon: faComments, label: 'Discussion' },
  { id: 'info-circle', icon: faInfoCircle, label: 'Information' },
  { id: 'question-circle', icon: faQuestionCircle, label: 'Help' },
  { id: 'exclamation-circle', icon: faExclamationCircle, label: 'Important' },
];

// Google Fonts options
export const googleFonts = [
  { id: 'inter', name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { id: 'roboto', name: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' },
  { id: 'open-sans', name: 'Open Sans', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap' },
  { id: 'poppins', name: 'Poppins', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
  { id: 'lato', name: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
  { id: 'montserrat', name: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap' },
  { id: 'nunito', name: 'Nunito', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap' },
  { id: 'source-sans', name: 'Source Sans Pro', url: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap' }
];

// Background patterns
export const backgroundPatterns = [
  { id: 'none', name: 'None', css: '' },
  { id: 'dots', name: 'Dots', css: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' },
  { id: 'grid', name: 'Grid', css: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' },
  { id: 'waves', name: 'Waves', css: 'linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.05) 25%, transparent 25%)', backgroundSize: '30px 30px' },
  { id: 'diagonal', name: 'Diagonal Lines', css: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 1px, transparent 1px, transparent 10px)', backgroundSize: 'auto' }
];

// Animation options
export const animationOptions = [
  { id: 'none', name: 'None', css: '' },
  { id: 'smooth', name: 'Smooth', css: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
  { id: 'bounce', name: 'Bounce', css: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  { id: 'slide', name: 'Slide', css: 'all 0.4s ease-in-out' },
  { id: 'fade', name: 'Fade', css: 'opacity 0.3s ease, transform 0.3s ease' }
];

// Chat window sizes
export const chatSizes = [
  { id: 'compact', name: 'Compact', width: '300px', height: '400px' },
  { id: 'standard', name: 'Standard', width: '350px', height: '450px' },
  { id: 'large', name: 'Large', width: '400px', height: '500px' },
  { id: 'full-height', name: 'Full Height', width: '350px', height: '80vh' }
]; 