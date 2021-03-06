import React, { Component } from 'react';
import {render} from 'react-dom';
import CarouselItem from './carouselitem.jsx';
import Slider from 'react-slick';
const api = require('../api/recommandation.js');

class Carousel extends Component {
  constructor(props) {
    super(props);

    this.rightClick = this.moveRight.bind(this)
    this.leftClick = this.moveLeft.bind(this)
    this.getRecommandatioResponse = this.getRecommandatioResponse.bind(this)

    this.state = {
      movies : null,
      active: 2,
      direction: ''
    }
  }

  getRecommandatioResponse(err, movies) {
    if (err) {
      this.props.router.push(err);
    } else {
      this.setState({
        movies : movies,
        active: this.state.active,
        direction: this.state.direction
      });
    }
  }

  componentWillMount() {
    api.getRecommandation(this.props.username, this.getRecommandatioResponse)
  }

  moveLeft() {
    let newActive = this.state.active
    newActive--
    this.setState({
      movies : this.state.movies,
      active: newActive < 0 ? this.state.movies.list.length - 1 : newActive,
      direction: 'left'
    })
  }

  moveRight() {
    let newActive = this.state.active
    this.setState({
      movies : this.state.movies,
      active: (newActive + 1) % this.state.movies.list.length,
      direction: 'right'
    })
  }

  generateItems() {
    var items = []
    var level
    for (var i = this.state.active - 2; i < this.state.active + 3; i++) {
      var index = i
      if (i < 0) {
        index = this.state.movies.list.length + i
      } else if (i >= this.state.movies.list.length) {
        index = i % this.state.movies.list.length
      }
      level = this.state.active - i
      items.push(<div key={this.state.movies.list[index].id}><CarouselItem movieObject={this.state.movies.list[index]}/></div>)
    }
    return items
  }

  render() {
    if (!this.state.movies) {
      return(<div></div>);
    }
    let rows = [];
    this.state.movies.list.map((row, index) => {
      rows.push(<div key={row.id} style={{'maxWidth': '100px !important'}}><CarouselItem movieObject={row}/></div>)
    });
    let settings = {
      dots: true,
      speed: 500,
      arrows: true,
      autoplay: true,
      slidesToShow: 5
    };
    return(
      <div className="customCarousel">
        {this.state.movies.field}
        <br/>
        <br/>
        <Slider {...settings}>
          {rows}
        </Slider>
        <br/>
        <br/>
      </div>
    );
  }
}
export default Carousel;
