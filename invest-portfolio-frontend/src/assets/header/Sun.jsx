const Sun = ({ width = 78, height, color = '#0022FF', ...props }) => {

    const sunHeight = height || (width * 74 / 78);
    
    return (
    <svg 
        width="78" 
        height ={sunHeight} 
        viewBox="0 0 78 74" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <circle cx="39" cy="37" r="19.5" stroke="black" stroke-width="5"/>
        <path d="M65.6569 9.00001L60 14.6569L61.0655 15.7223L66.7223 10.0655L65.6569 9.00001Z" stroke="black" stroke-width="2"/>
        <path d="M77 36H69V37.5068H77V36Z" stroke="black" stroke-width="2"/>
        <path d="M9 36H1V37.5068H9V36Z" stroke="black" stroke-width="2"/>
        <path d="M66.7223 63.6569L61.0654 58L59.9999 59.0655L65.6568 64.7223L66.7223 63.6569Z" stroke="black" stroke-width="2"/>
        <path d="M39.5068 73L39.5068 65L38 65L38 73L39.5068 73Z" stroke="black" stroke-width="2"/>
        <path d="M39.5068 9L39.5068 1L38 1L38 9L39.5068 9Z" stroke="black" stroke-width="2"/>
        <path d="M17.7223 15.6569L12.0654 10L10.9999 11.0655L16.6568 16.7223L17.7223 15.6569Z" stroke="black" stroke-width="2"/>
        <path d="M16.6569 58L11 63.6569L12.0655 64.7223L17.7223 59.0655L16.6569 58Z" stroke="black" stroke-width="2"
        />
    </svg>
    );
    };

    export default Sun;