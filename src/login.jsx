import React from 'react';
import PropTypes from 'prop-types';

export default function Login({ loginCallback, createUserCallback }) {
  const [displayName, setDisplayName] = React.useState(null);
  const [email, setEmail] = React.useState(null);
  const [password, setPassword] = React.useState(null);
  const [createUser, setCreateUser] = React.useState(null);

  const onClickLogin = () => {
    if (!email || !password) return;
    loginCallback(email, password);
  };

  const onClickCreateUser = () => {
    if (!displayName || !email || !password) return;
    createUserCallback(displayName, email, password);
  };

  return (
    <div className="Login">
      <input
        type="text"
        className="displayName"
        placeholder="Display Name"
        hidden={!createUser}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <input type="text" className="email" placeholder="email" onChange={(e) => setEmail(e.target.value)} />
      <input type="text" className="password" placeholder="password" onChange={(e) => setPassword(e.target.value)} />
      <button type="button" onClick={onClickLogin} disabled={!email || !password} hidden={createUser}>Login</button>
      <button type="button" onClick={onClickCreateUser} disabled={!email || !password} hidden={!createUser}>Create User</button>
      <button type="button" onClick={() => setCreateUser(!createUser)} hidden={createUser}>Create New User?</button>
    </div>
  );
}

Login.propTypes = {
  loginCallback: PropTypes.func.isRequired,
  createUserCallback: PropTypes.func.isRequired,
};
