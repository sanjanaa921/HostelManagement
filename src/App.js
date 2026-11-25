import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import './App.css';
import './index.css';

import { About } from './components/about';
import { Home } from './components/home';
import { Vichla } from './components/vichla';
import { Signup } from './components/signup';
import { Signin } from './components/signin';
import { Adminsignin } from './components/adminsignin';
import { Adminhome } from './components/adminhome';
import { Adminattendance } from './components/adminattendance';
import { Admincomplains } from './components/admincomplains';
import { Adminpasses } from './components/adminpasses';
import { Adminfeedback } from './components/adminfeedback';
import { Adminmess } from './components/adminmess';
import { Adminsidebar } from './components/adminsidebar';
import { Temp } from './components/temp';
import { Complains } from './components/complains';
import { Attendance } from './components/attendance';
import { Tsidebar } from './components/tsidebar';
import NoteState from './context/noteState';
import { Logo } from './components/ui/Logo';

function App() {
  return (
    <div className="App min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      <NoteState>
        <Router>
          <div className="flex flex-col lg:flex-row min-h-screen w-full relative">
            <Tsidebar />
            <Adminsidebar />
            
            <main className="flex-1 min-w-0 w-full overflow-x-hidden pt-16 lg:pt-0 flex flex-col justify-between">
              <div className="w-full">
                <Routes>
                  <Route exact path="/" element={<Home />} />
                  <Route exact path="/home" element={<Home />} />
                  <Route exact path="/vichla" element={<Vichla />} />
                  <Route exact path="/complains" element={<Complains />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/temp" element={<Temp />} />
                  <Route path="/attendance" element={<Attendance />} />

                  <Route exact path="/signup" element={<Signup />} />
                  <Route exact path="/signin" element={<Signin />} />
                  <Route exact path="/adminhome" element={<Adminhome />} />
                  <Route exact path="/adminsignin" element={<Adminsignin />} />
                  <Route exact path="/adminattendance" element={<Adminattendance />} />
                  <Route exact path="/admincomplains" element={<Admincomplains />} />
                  <Route exact path="/adminpasses" element={<Adminpasses />} />
                  <Route exact path="/adminfeedback" element={<Adminfeedback />} />
                  <Route exact path="/adminmess" element={<Adminmess />} />
                </Routes>
              </div>

              {/* Minimalist Professional Footer */}
              <footer className="py-4 px-6 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm text-center text-xs text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <Logo size="xs" />
                  <span>Smart Campus Accommodation Portal &bull; MCA University Project</span>
                </div>
              </footer>
            </main>
          </div>
        </Router>
      </NoteState>
    </div>
  );
}

export default App;
