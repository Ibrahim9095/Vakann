import { Route, Switch, Router } from "wouter"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { DashboardNotFound } from "@/components/layout/DashboardNotFound"
import DashboardSummary from "./DashboardSummary"
import ProfileEditor from "./ProfileEditor"
import Applications from "./Applications"
import ContactRequests from "./ContactRequests"
import Subscriptions from "./Subscriptions"
import Checkout from "./Checkout"
import Notifications from "./Notifications"
import RecommendedJobs from "./RecommendedJobs"

const BASE = "/dashboard/candidate"

export default function CandidateDashboardRouter() {
  return (
    <DashboardLayout requiredRole="candidate" basePath={BASE}>
      <Router base={BASE}>
        <Switch>
          <Route path="/" component={DashboardSummary} />
          <Route path="/profile" component={ProfileEditor} />
          <Route path="/applications" component={Applications} />
          <Route path="/contact-requests" component={ContactRequests} />
          <Route path="/subscriptions" component={Subscriptions} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/recommended" component={RecommendedJobs} />
          <Route>
            <DashboardNotFound homeHref="/" />
          </Route>
        </Switch>
      </Router>
    </DashboardLayout>
  )
}
