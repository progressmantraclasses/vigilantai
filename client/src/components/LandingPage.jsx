import { Layout, Menu, Button, Card } from 'antd';
import { HomeOutlined, InfoCircleOutlined, PhoneOutlined, SafetyOutlined, FileTextOutlined, DashboardOutlined, FireOutlined, UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Footer } = Layout;

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [  
    { title: "AI Crime Detection", description: "Identifies fights, theft, and vandalism from CCTV and mobile recordings.", icon: <SafetyOutlined />, link: "/features#crime-detection" },
    { title: "Real-Time Alerts", description: "Sends instant notifications to law enforcement and security teams.", icon: <FireOutlined />, link: "/features#real-time-alerts" },
    { title: "Safer Route Suggestions", description: "AI recommends alternative routes based on crime data and surveillance.", icon: <DashboardOutlined />, link: "/features#route-suggestions" },
    { title: "Emergency Panic Alerts", description: "Trigger alerts via button press, voice command, or gesture.", icon: <PhoneOutlined />, link: "/features#panic-alerts" },
    { title: "Legal Assistance Chatbot", description: "Provides easy-to-understand legal rights and support.", icon: <FileTextOutlined />, link: "/features#legal-assistance" },
    { title: "Decentralized Security", description: "Blockchain ensures anonymous and tamper-proof incident reporting.", icon: <UserOutlined />, link: "/features#decentralized-security" }
  ];

  const scrollToFeatures = () => {
    document.getElementById("features-section").scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Layout className="min-h-screen bg-[#0A192F] text-white">
      {/* Navbar */}
      <Header className="bg-[#112240] flex justify-between items-center px-6 shadow-lg border-b border-gray-600">
        <div className="text-xl font-bold text-white">Vigilant AI</div>
        <Menu theme="dark" mode="horizontal" className="bg-[#112240] text-white border-none" selectedKeys={[]}>      
          {[{ key: "1", icon: <HomeOutlined />, label: "Home", onClick: () => navigate("/") },
            { key: "2", icon: <InfoCircleOutlined />, label: "Features", onClick: scrollToFeatures },
            { key: "3", icon: <DashboardOutlined />, label: "Dashboard", onClick: () => navigate("/dashboard") },
            { key: "4", icon: <FileTextOutlined />, label: "Raise Complaint", onClick: () => navigate("/complaint") },
            { key: "5", icon: <SafetyOutlined />, label: "Legal Assistance", onClick: () => navigate("/legal-assistance") },
            { key: "6", icon: <FireOutlined />, label: "Heatmap", onClick: () => navigate("/heatmap") },
            { key: "7", icon: <UserOutlined />, label: "Wearable Integration", onClick: () => navigate("/wearable") },
            { key: "8", icon: <PhoneOutlined />, label: "Contact", onClick: () => navigate("/contact") }].map(item => (
            <Menu.Item key={item.key} icon={item.icon} onClick={item.onClick} className="relative group cursor-pointer">
              {item.label}
              <motion.div 
                className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"
              />
            </Menu.Item>
          ))}
        </Menu>
      </Header>

      {/* Hero Section */}
      <Content 
        className="text-center py-40 bg-[#0A192F] bg-cover bg-center relative flex flex-col justify-center items-center" 
        style={{ backgroundImage: "url('https://www.centraliamo.gov/sites/g/files/vyhlif13891/files/media/police/image/7601/crime_prevention.jpg')", backgroundBlendMode: "overlay", backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      >
        <motion.h1 
          className="text-6xl font-bold text-cyan-300 z-10 drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          AI-Powered Security & Assistance
        </motion.h1>
        <motion.p 
          className="text-xl text-white font-bold mt-4 max-w-2xl text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Real-time crime detection, panic alerts, and legal support at your fingertips.
        </motion.p>
        <Button type="primary" size="large" className="mt-6 text-2xl bg-blue-600 border-none" onClick={scrollToFeatures}>Get Started</Button>
      </Content>

      {/* Features Section */}
      <Content id="features-section" className="px-10 py-16">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Features of Vigilant AI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <Card 
                className="bg-[#112240] text-white border-none shadow-lg flex items-center p-4 cursor-pointer"
                onClick={() => navigate(feature.link)}
              >
                <div className="text-4xl text-blue-400 mr-4">{feature.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-400 mt-2">{feature.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Content>

      {/* Footer */}
      <Footer className="bg-[#112240] text-center text-gray-400 py-6">
        <div className="mb-4">
          <p>Contact Us: support@vigilantai.com | +123 456 7890</p>
          <p>Follow us on social media for updates and security tips.</p>
        </div>
        <p>© 2025 Vigilant AI. All rights reserved.</p>
      </Footer>
    </Layout>
  );
}
