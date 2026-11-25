import React, { useContext } from 'react';
import noteContext from '../context/noteContext';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Database, 
  Server, 
  Cpu, 
  Layers, 
  Lock, 
  QrCode, 
  MapPin, 
  GraduationCap, 
  CheckCircle2,
  Code2,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { PageHeader } from './ui/PageHeader';
import { Badge } from './ui/Badge';

export const About = () => {
  const { dispatch } = useContext(noteContext);

  function handleClick() {
    dispatch({ type: 'UPDATE_VALUE', payload: true });
  }

  function fandleClick() {
    dispatch({ type: 'UPDATE_VALUE', payload: false });
  }

  const stackItems = [
    { title: 'Frontend Layer', tech: 'React 18 & Tailwind CSS', desc: 'SPA architecture with React Router v6, Material-UI icons, and Framer Motion micro-interactions.', icon: Layers, color: 'blue' },
    { title: 'Backend REST API', tech: 'Node.js & Express.js', desc: 'Modular route architecture with controllers for authentication, rooms, attendance, gate passes, and complaints.', icon: Server, color: 'emerald' },
    { title: 'Database & Storage', tech: 'MongoDB & GridFS', desc: 'NoSQL document database with Mongoose ODM and GridFS chunks for unstructured photo binaries.', icon: Database, color: 'purple' },
    { title: 'AI / Computer Vision', tech: 'Python 3.11 & OpenCV', desc: 'Flask microservice with MiniFASNet anti-spoofing and face recognition for attendance roll calls.', icon: Cpu, color: 'amber' },
  ];

  const highlights = [
    { title: 'Role-Based Authentication', desc: 'Secure student and admin access control with bcrypt password hashing and tamper-evident JWTs.', icon: Lock },
    { title: 'QR Code Security Tokens', desc: 'Instant cryptographic gate pass generation with digital stamps and guard scanner verification.', icon: QrCode },
    { title: 'Campus Geofencing', desc: 'Polygon coordinate ray-casting algorithm to ensure students are physically on campus when logging roll call.', icon: MapPin },
    { title: 'Automated Grievance Lifecycle', desc: 'Real-time student complaint submission, status tracking, and admin resolution workflow.', icon: ShieldCheck },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="About the Modern Hostel Management System"
        description="A comprehensive enterprise-grade student accommodation platform engineered as an MCA University Minor Project."
        badge={<Badge variant="primary">MCA University Project</Badge>}
      />

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white border border-slate-800 shadow-2xl relative overflow-hidden"
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold">
            <GraduationCap className="w-4 h-4" />
            <span>Master of Computer Applications &bull; Minor Project</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional Accommodation & Campus Logistics System
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Designed to digitize and automate daily hostel operations—including student room allocation, biometric camera attendance, digital QR gate token verification for campus gate guards, mess account tracking, and automated maintenance grievance redressal.
          </p>
        </div>
      </motion.div>

      {/* Technology Architecture Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Code2 className="w-5 h-5 text-blue-600" />
          <span>Full-Stack Architecture & Technology Stack</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stackItems.map((item, idx) => (
            <Card key={idx} className="p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-4">
                  <item.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">{item.tech}</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Key Innovation Highlights */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>Core Engineering Highlights</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highlights.map((h, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <h.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{h.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Viva / Presentation Notes Card */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Project Presentation & Viva Highlights</span>
          </h4>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
            <li><strong>Client-Server Separation:</strong> Decoupled React frontend communicating via stateless REST endpoints with Node.js/Express.</li>
            <li><strong>Data Integrity:</strong> MongoDB schemas enforce unique indexes on student emails and allotted room numbers to prevent double booking.</li>
            <li><strong>Responsive UI/UX:</strong> Standardized on the UI UX Pro Max design system with responsive layouts across mobile, tablet, and desktop viewports.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Hidden test buttons preserving legacy context tests */}
      <div style={{ display: 'none' }}>
        <button onClick={handleClick}>Change true</button>
        <button onClick={fandleClick}>Cha false</button>
      </div>
    </div>
  );
};
export default About;
