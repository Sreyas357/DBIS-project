import React from 'react';
import Group from './Group';
import '../css/group.css';

const GroupList = ({ groups, loading, userMemberships, onJoinLeave, onRequestJoin, pendingRequests = [] }) => {
  if (loading) {
    return (
      <div className="groups-loading">
        <p>Loading groups...</p>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="groups-empty">
        <p>No groups found. Create a new group to get started!</p>
      </div>
    );
  }

  return (
    <div className="groups-list">
      {groups.map(group => {
        const isUserMember = userMemberships
          ? userMemberships.some(membership => membership.group_id === group.group_id)
          : false;

        // Check if user has already sent a request to join this group
        const hasPendingRequest = pendingRequests.some(
          request => request.group_id === group.group_id && request.status === 'pending'
        );

        return (
          <Group 
            key={group.group_id}
            group={group}
            isUserMember={isUserMember}
            onJoinLeave={onJoinLeave}
            onRequestJoin={onRequestJoin}
            hasPendingRequest={hasPendingRequest}
          />
        );
      })}
    </div>
  );
};

export default GroupList; 