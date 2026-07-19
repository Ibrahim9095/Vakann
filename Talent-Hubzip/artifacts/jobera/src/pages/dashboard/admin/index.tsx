import { Route, Switch, Router } from "wouter"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { DashboardNotFound } from "@/components/layout/DashboardNotFound"
import AdminDashboardSummary from "./DashboardSummary"
import UsersManager from "./UsersManager"
import JobsManager from "./JobsManager"
import CandidatesManager from "./CandidatesManager"
import CompaniesManager from "./CompaniesManager"

const BASE = "/dashboard/admin"

export default function AdminDashboardRouter() {
  return (
    <DashboardLayout requiredRole="admin" basePath={BASE}>
      <Router base={BASE}>
        <Switch>
          <Route path="/" component={AdminDashboardSummary} />
          <Route path="/users" component={UsersManager} />
          <Route path="/jobs" component={JobsManager} />
          <Route path="/candidates" component={CandidatesManager} />
          <Route path="/companies" component={CompaniesManager} />
          <Route>
            <DashboardNotFound homeHref="/" />
          </Route>
        </Switch>
      </Router>
    </DashboardLayout>
  )
}
