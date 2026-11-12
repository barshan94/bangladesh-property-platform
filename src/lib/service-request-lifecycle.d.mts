export type ServiceRequestStatus =
  | "new"
  | "triaged"
  | "assigned"
  | "in_progress"
  | "waiting_on_client"
  | "resolved"
  | "closed"
  | "spam";

export type ServiceRequestRole =
  | "intake_coordinator"
  | "case_manager"
  | "administrator";

export declare const serviceRequestTransitions: Readonly<
  Record<ServiceRequestStatus, readonly ServiceRequestStatus[]>
>;

export declare const serviceRequestRoles: Readonly<{
  intake_coordinator: "intake_coordinator";
  case_manager: "case_manager";
  administrator: "administrator";
}>;

export declare function isAllowedServiceRequestTransition(
  from: string,
  to: string
): boolean;

export declare function canRolePerformServiceRequestTransition(
  role: string,
  from: string,
  to: string
): boolean;

export declare function assertServiceRequestTransition(
  role: string,
  from: string,
  to: string
): true;
