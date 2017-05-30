import React, { Component } from 'react';
import {render} from 'react-dom';
const Redux = require('react-redux');
const Router = require('react-router');
import styles from './style/index.css';
import NavBar from './navBar.jsx';
import MovieCell from './movieCell.jsx';
import MovieList from './movieList.jsx';
import Authentification from './authentification.jsx';
import NotFound from './notFound.jsx';

class Profil extends Component {
  constructor(props) {
    super(props);
    this.state = {
      movies : null,
      redirect : null
    }
  }

  componentWillReceiveProps(Newprops) {
    console.log(Newprops);
    console.log("component will receive props !");
    if (Newprops.username >= 0) {
    } else {
      console.log("Not COnnected");
      console.log("No session found");
      console.log(this.props);
      this.props.router.push('/login');
    }
  }

  componentWillMount() {
    console.log("Check if connected");
    console.log(this.props);
    if (this.props.username) {
      let req = new XMLHttpRequest();
      req.withCredentials = true;
      let self = this;
      req.onreadystatechange = function() {
          if (req.status == 403) {
            console.log("Not Authorized");
            self.props.router.push('/login');
          }
          else {
            if (self.state.movies == null) {
                console.log("Authorized");
                if (req.status == 200 && req.readyState == XMLHttpRequest.DONE) {
                  self.setState({
                    movies : JSON.parse(req.responseText)
                  });
                }
            }
         }
      }
      req.open('GET', 'http://localhost:4242/api/favorites/'+this.props.username, true);
      req.send(null);
    }/* else {
      console.log("NOt Connected");
      console.log("No session found");
      console.log(this.props);
      this.props.router.push('/login');
    }*/
  }

  render() {
    console.log('UPDATE MODAFUCKING PROFIL');
    if (this.state.movies == null) {
      return (<div>No movies in your favorites</div>);
    }
    else {
      let rows = [];
      this.state.movies.map((row, id) => {
          console.log("in loop");
          rows.push(<MovieCell key={id} index={id} movieObject={row}/>);
      })
      return(
      <div>
        <NavBar />
        <div className="container-fluid">
            <div className="row">
              <div className="col-sm-12">
                <div className="page-header">
                  <h1>Hello {this.props.username} , these are your favorites movies</h1>
                  </div>
              </div>
            </div>
            {rows}
        </div>
      </div>
      );
    }
  }
}

const mapStateToProps = (state, router)  => {
  return {
    username: state.username
  };
}



export default Redux.connect(
  mapStateToProps
)(Profil);
