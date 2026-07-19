import { Route, Switch, Router } from "wouter"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { DashboardNotFound } from "@/components/layout/DashboardNotFound"
import DashboardSummary from "./DashboardSummary"
import CompanyProfile from "./CompanyProfile"
import JobsList from "./JobsList"
import JobForm from "./JobForm"
import CandidatesBrowser from "./CandidatesBrowser"
import Applications from "./Applications"
import ContactRequests from "./ContactRequests"
import HrSubscriptions from "./HrSubscriptions"

const BASE = "/dashboard/hr"

export default function HrDashboardRouter() {
  return (
    <DashboardLayout requiredRole="hr" basePath={BASE}>
      <Router base={BASE}>
        <Switch>
          <Route path="/" component={DashboardSummary} />
          <Route path="/company" component={CompanyProfile} />
          <Route path="/jobs/new" component={JobForm} />
          <Route path="/jobs/:id/edit" component={JobForm} />
          <Route path="/jobs" component={JobsList} />
          <Route path="/candidates" component={CandidatesBrowser} />
          <Route path="/applications" component={Applications} />
          <Route path="/contact-requests" component={ContactRequests} />
          <Route path="/subscriptions" component={HrSubscriptions} />
          <Route>
            <DashboardNotFound homeHref="/" />
          </Route>
        </Switch>
      </Router>
    </DashboardLayout>
  )
}
