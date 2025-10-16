const Sun = ({ width = 78, height, color = '#0022FF', ...props }) => {

    const sunHeight = height || (width * 78 / 78);
    
    return (
        <svg 
            width={width}
            height={sunHeight}
            viewBox="0 0 78 78" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <circle cx="39" cy="39" r="19.5" stroke={color} strokeWidth="5"/>
            <path d="M65.6569 11L60 16.6569L61.0655 17.7223L66.7223 12.0655L65.6569 11Z" stroke={color} strokeWidth="2"/>
            <path d="M77 38H69V39.5068H77V38Z" stroke={color} strokeWidth="2"/>
            <path d="M9 38H1V39.5068H9V38Z" stroke={color} strokeWidth="2"/>
            <path d="M66.7223 65.6569L61.0654 60L59.9999 61.0655L65.6568 66.7223L66.7223 65.6569Z" stroke={color} strokeWidth="2"/>
            <path d="M39.5068 77L39.5068 69L38 69L38 77L39.5068 77Z" stroke={color} strokeWidth="2"/>
            <path d="M39.5068 9L39.5068 1L38 1L38 9L39.5068 9Z" stroke={color} strokeWidth="2"/>
            <path d="M17.7223 17.6569L12.0654 12L10.9999 13.0655L16.6568 18.7223L17.7223 17.6569Z" stroke={color} strokeWidth="2"/>
            <path d="M16.6569 60L11 65.6569L12.0655 66.7223L17.7223 61.0655L16.6569 60Z" stroke={color} strokeWidth="2"/>
        </svg>
    );
};

export default Sun;