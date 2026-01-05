import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Whiteboard from './components/Board/Whiteboard';

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
      <h1>Streamline Collab</h1>
      <button onClick={() => navigate(`/board/${Date.now()}`)} style={{ padding: '10px 20px', fontSize: '20px' }}>
        Start New Board
      </button>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/board/:roomId" element={<Whiteboard />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;