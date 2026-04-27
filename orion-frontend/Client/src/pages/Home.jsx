
import Navbar from '../components/NavBar';
import { SiPython, SiReact, SiRedis, SiMongodb } from 'react-icons/si';
import { FaDatabase } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const techStack = [
        { name: "PYTHON", icon: <SiPython size={24} />, color: "hover:text-yellow-300" },
        { name: "REACT", icon: <SiReact size={24} />, color: "hover:text-cyan-400" },
        { name: "REDIS", icon: <SiRedis size={24} />, color: "hover:text-red-500" },
        { name: "MONGODB", icon: <SiMongodb size={24} />, color: "hover:text-green-500" },
        { name: "VECTORDB", icon: <FaDatabase size={24} />, color: "hover:text-purple-400" },
    ];

    const navigate = useNavigate();

    return (
        <>
            <Navbar ButtonTwoText={'Connect to Orion'} ButtonTwoRoute={'/upload'} />
            <div className="relative min-h-screen text-white overflow-hidden font-sans selection:bg-lime-500/30">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size[24px_24px]"></div>
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-1/4 w-125 h-125 bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{animationDuration: '4s'}}></div>
                    <div className="absolute bottom-[-10%] right-1/4 w-150 h-150 bg-lime-500/10 rounded-full blur-[120px] mix-blend-screen"></div>
                </div>

                <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-10">
                    
                    <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10 cursor-default">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
                        </span>
                        <span className="text-xs font-semibold tracking-wide text-gray-300">
                            ORION <span className="text-lime-400">v2.0</span> IS LIVE
                        </span>
                    </div>

                    <h1 className="max-w-6xl mx-auto text-6xl md:text-9xl font-bold tracking-tighter leading-none mb-6">
                        <span className="inline-block text-transparent bg-clip-text bg-linear-to-b from-white via-white to-gray-600 drop-shadow-sm">
                            ORION
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
                        Intelligent automation that adapts to your workflow. 
                        <span className="text-gray-200"> Evolving in real-time.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-20">
                        <button onClick={()=>(navigate('/upload'))} className="group relative px-8 py-3 rounded-full bg-[#D1F896] text-black font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(209,248,150,0.5)]">
                            <span className="relative z-10">Start Free Trial</span>
                            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-40 blur-md transition-opacity" />
                        </button>
                        
                        <button className="px-8 py-3 rounded-full bg-white/10 text-white font-medium text-lg border border-white/30 hover:bg-white/10 transition-all backdrop-blur-sm">
                            Who We Are?
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-[0.2em]">ORION’S DNA</p>
                        
                        <div className="flex items-center gap-6 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl hover:border-white/20 transition-all duration-500">
                            {techStack.map((tech, index) => (
                                <div 
                                    key={index} 
                                    className={`text-gray-400 transition-all duration-300 hover:scale-125 cursor-pointer ${tech.color}`}
                                    title={tech.name}
                                >
                                    {tech.icon}
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default Home;