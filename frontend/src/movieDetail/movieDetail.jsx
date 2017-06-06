import React, { Component } from 'react';
import { render } from 'react-dom';
const Redux = require('react-redux');
import styles from '../style/index.css';
import { withRouter } from 'react-router';
import NavBar from '../global/navBar.jsx';
import Modal from './modal.jsx'
import Carousel from '../carousel/carousel.jsx'

class MovieDetail extends Component {

  constructor(props) {
    super(props);

    this.showModal = this.showModal.bind(this);
    this.dismissModal = this.dismissModal.bind(this);

    const { router, params, location, routes } = this.props

    this.state = {
      movieID : this.props.routeParams.id,
      movieObject : null,
      modalStyle : "none"
    }
  }

  componentWillReceiveProps(NewProps) {
    this.setState({
      movieID : NewProps.routeParams.id,
      movieObject : null,
      modalStyle : "none"
    }, () => {
      this.updateMovieDetail();
    });
  }

  dismissModal() {
    this.setState({
      movieID : this.state.movieID,
      movieObject : this.state.movieObject,
      modalStyle : "none"
    });
  }

  showModal() {
    this.setState({
      movieID : this.state.movieID,
      movieObject : this.state.movieObject,
      modalStyle : "block"
    }, () => { console.log("modal style " + this.state.modalStyle) });
  }

  updateMovieDetail() {
    let req = new XMLHttpRequest();
    req.withCredentials = true;
    req.onreadystatechange = () => {
      if (req.status == 403) {
        console.log("Not Authorized");
        this.props.router.push('/login');
      }
      else {
        console.log("Authorized");
        if (req.status == 200 && req.readyState == XMLHttpRequest.DONE) {
          let movie = JSON.parse(req.responseText);
          console.log(movie[0]);
          this.setState(
            {
              movieID : this.state.movieID,
              movieObject : movie[0],
              modalStyle : this.state.modalStyle
            }
          )
        }
      }
    }
    req.open('GET', 'http://localhost:4242/api/movie/'+this.state.movieID, true);
    req.send(null);
  }

  componentWillMount() {
    this.updateMovieDetail();
  }

  render() {
    if (!this.state.movieObject) {
      return (<div></div>);
    }
    return (
      <div>
        <NavBar />
        <Modal dismissModal={this.dismissModal} visible={this.state.modalStyle} source={this.state.movieObject.Poster}/>
        <div className="container">
          <div className="card">
            <div className="container-fliud">
              <div className="wrapper row">
                <div className="col-md-6">
                  <img onClick={this.showModal} className="center-img" src={this.state.movieObject.Poster} />
                </div>
                <div className="details col-md-6">
                  <h3 className="product-title">{this.state.movieObject.Title}</h3>
                  <div className="rating">
                    <div className="stars">
                      <span className="fa fa-star checked"></span>
                      <span className="fa fa-star checked"></span>
                      <span className="fa fa-star checked"></span>
                      <span className="fa fa-star"></span>
                      <span className="fa fa-star"></span>
                    </div>
                    <span className="review-no">41 reviews</span>
                  </div>
                  <p className="product-description">Suspendisse quos? Tempus cras iure temporibus? Eu laudantium cubilia sem sem! Repudiandae et! Massa senectus enim minim sociosqu delectus posuere.</p>
                  <h4 className="price">current price: <span>$ 299</span></h4>
                  <p className="vote"><strong>91%</strong> of buyers enjoyed this product! <strong>(87 votes)</strong></p>
                  <h5 className="sizes">sizes:
                    <span className="size" data-toggle="tooltip" title="small">s</span>
                    <span className="size" data-toggle="tooltip" title="medium">m</span>
                    <span className="size" data-toggle="tooltip" title="large">l</span>
                    <span className="size" data-toggle="tooltip" title="xtra large">xl</span>
                  </h5>
                  <div className="action">
                    <button className="add-to-cart btn btn-default" type="button">add to cart</button>
                    <button className="like btn btn-default" type="button"><span className="fa fa-heart"></span></button>
                  </div>
                </div>
              </div>
              <div className="wrapper row">
                <div className="center-img videoPadding">
                  <h3>Trailer of the movie</h3>
                  <iframe
                    allowFullScreen
                    frameBorder="0"
                    height="420"
                    src={this.state.movieObject.Youtube}
                    width="746"
                    />
                </div>
              </div>
              <Carousel username={this.props.username} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, router) => {
  return {
    username: state.username,
    favorites : state.favorites
  }
};

export default withRouter(Redux.connect(mapStateToProps)(MovieDetail));