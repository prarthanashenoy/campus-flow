# CampusFlow Authorization Policy
# Deployed to Oso Cloud via the oso-cloud CLI / SDK.
#
# Actors:  User (identified by their database ID)
# Resources: Opportunity, Registration
#
# Roles are stored as facts in Oso Cloud:
#   has_role(User{"<id>"}, "student",   Opportunity{"global"})
#   has_role(User{"<id>"}, "organizer", Opportunity{"global"})
#   has_role(User{"<id>"}, "owner",     Opportunity{"<opp-id>"})

# ── Resource declarations ────────────────────────────────────

resource Opportunity {
  roles   = ["owner", "organizer", "student"];
  permissions = [
    "read",
    "create",
    "update",
    "delete",
    "read_registrations",
  ];

  # Owners (the organizer who created it) can do everything
  "read"               if "owner";
  "update"             if "owner";
  "delete"             if "owner";
  "read_registrations" if "owner";

  # Any organizer can create new opportunities
  "create" if "organizer";

  # Students (and everyone) can read published opportunities
  "read" if "student";
}

resource Registration {
  roles       = ["owner"];
  permissions = ["read", "create", "delete"];

  "read"   if "owner";
  "create" if "owner";
  "delete" if "owner";
}

# ── Global roles ─────────────────────────────────────────────
# Applied to the special "global" resource so we don't need
# per-resource role facts for site-wide roles.

allow(actor: User, action: String, resource: Opportunity) if
  has_role(actor, "student", resource) and
  action in ["read"];

allow(actor: User, action: String, resource: Opportunity) if
  has_role(actor, "organizer", resource) and
  action in ["create"];

allow(actor: User, action: String, resource: Opportunity) if
  has_role(actor, "owner", resource) and
  action in ["read", "update", "delete", "read_registrations"];

allow(actor: User, action: String, resource: Registration) if
  has_role(actor, "owner", resource) and
  action in ["read", "create", "delete"];
