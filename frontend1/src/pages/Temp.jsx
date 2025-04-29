import React, { useState, memo } from 'react';

const Child = memo(({ onClick }) => {
  console.log('Child rendered');
  return <button onClick={onClick}>Click Me</button>;
});

function Temp() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log('Button clicked');
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <Child onClick={handleClick} />
    </div>
  );
}

export default Temp;