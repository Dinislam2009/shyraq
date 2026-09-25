export type WorkspaceRole="owner"|"admin"|"editor"|"reviewer"|"viewer"|"member"|"";

export function canEditWorkspace(role:WorkspaceRole){return ["owner","admin","editor"].includes(role);}
export function canAdminWorkspace(role:WorkspaceRole){return ["owner","admin"].includes(role);}
export function canDeleteWorkspaceMember(actorRole:WorkspaceRole,targetRole:WorkspaceRole){
 if(!canAdminWorkspace(actorRole))return false;
 if(targetRole==="owner")return false;
 if(actorRole==="admin"&&targetRole==="admin")return false;
 return true;
}
export function canChangeWorkspaceMemberRole(actorRole:WorkspaceRole,targetRole:WorkspaceRole){
 return canDeleteWorkspaceMember(actorRole,targetRole);
}
export function canManageDeck(role:WorkspaceRole){return canEditWorkspace(role);}
export function canDeleteDeck(role:WorkspaceRole){return canAdminWorkspace(role);}
