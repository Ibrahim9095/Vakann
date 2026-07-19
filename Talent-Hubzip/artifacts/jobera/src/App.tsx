import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { AuthProvider } from '@/context/auth-context';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Jobs from '@/pages/Jobs';
import JobDetail from '@/pages/JobDetail';
import Candidates from '@/pages/Candidates';
import CandidateDetail from '@/pages/CandidateDetail';
import CompanyDetail from '@/pages/CompanyDetail';
import Companies from '@/pages/Companies';
import NotFound from '@/pages/not-found';

import CandidateDashboardRouter from '@/pages/dashboard/candidate';
import HrDashboardRouter from '@/pages/dashboard/hr';
import AdminDashboardRouter from '@/pages/dashboard/admin';
import { DashboardRedirect } from '@/components/layout/DashboardNotFound';

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  const isDashboard = location.startsWith('/dashboard');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <Switch>
          <Route path="/" component={Home} />
          
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/register" component={Register} />
          
          <Route path="/jobs" component={Jobs} />
          <Route path="/jobs/:id" component={JobDetail} />
          
          <Route path="/candidates" component={Candidates} />
          <Route path="/candidates/:id" component={CandidateDetail} />
          <Route path="/companies" component={Companies} />
          <Route path="/companies/:id" component={CompanyDetail} />

          {/* Dashboards */}
          <Route path="/dashboard" component={DashboardRedirect} />
          <Route path="/dashboard/admin" component={AdminDashboardRouter} />
          <Route path="/dashboard/admin/*" component={AdminDashboardRouter} />
          <Route path="/dashboard/candidate" component={CandidateDashboardRouter} />
          <Route path="/dashboard/candidate/*" component={CandidateDashboardRouter} />
          <Route path="/dashboard/hr" component={HrDashboardRouter} />
          <Route path="/dashboard/hr/*" component={HrDashboardRouter} />
          
          <Route component={NotFound} />
        </Switch>
      </div>
      {!isDashboard && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
