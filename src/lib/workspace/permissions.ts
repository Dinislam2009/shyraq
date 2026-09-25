export type WorkspaceRole="owner"|"admin"|"editor"|"reviewer"|"viewer"|"member"|"";
export type DeckRole="editor"|"commenter"|"viewer"|"none";

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

export function workspaceRoleToDeckRole(role:WorkspaceRole):DeckRole{
 if(["owner","admin","editor"].includes(role))return "editor";
 if(role==="reviewer")return "commenter";
 if(role==="viewer"||role==="member")return "viewer";
 return "none";
}
export function resolveDeckRole(workspaceRole:WorkspaceRole,overrideRole:DeckRole|""):DeckRole{
 return overrideRole||workspaceRoleToDeckRole(workspaceRole);
}
export function canReadDeck(role:DeckRole){return role!=="none";}
export function canCommentDeck(role:DeckRole){return role==="commenter"||role==="editor";}
export function canEditDeck(role:DeckRole){return role==="editor";}
