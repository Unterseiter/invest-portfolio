const Gear = ({ width = 80, height, color = 'var(--primary-color))', ...props }) => {

    const gearHeight = height || (width * 1 / 1);

    return (
        <svg width={width}
            height={gearHeight}
            viewBox="0 0 80 80" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            {...props}
            >
            <circle cx="39.5" cy="39.5" r="23.5" stroke="white" stroke-width="14" />
            <path d="M67.5201 16.6569L61.8633 11L59 13.8633L64.6568 19.5202L67.5201 16.6569Z" stroke="white" stroke-width="6" />
            <path d="M76.0493 43L76.0493 35L72 35L72 43L76.0493 43Z" stroke="white" stroke-width="6" />
            <path d="M7.04932 43L7.04932 35L2.99999 35L2.99999 43L7.04932 43Z" stroke="white" stroke-width="6" />
            <path d="M64.6569 60L59 65.6569L61.8633 68.5202L67.5202 62.8633L64.6569 60Z" stroke="white" stroke-width="6" />
            <path d="M20.5201 65.6569L14.8633 60L12 62.8633L17.6568 68.5202L20.5201 65.6569Z" stroke="white" stroke-width="6" />
            <path d="M16.6569 11L11 16.6569L13.8633 19.5202L19.5202 13.8633L16.6569 11Z" stroke="white" stroke-width="6" />
            <path d="M44 3L36 3V7.04932H44V3Z" stroke="white" stroke-width="6" />
            <path d="M44 72H36V76.0493H44V72Z" stroke="white" stroke-width="6" />
        </svg>
    );
};

export default Gear;