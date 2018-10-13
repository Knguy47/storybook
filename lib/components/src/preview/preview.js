import { window } from 'global';
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import Events from '@storybook/core-events';
import { types } from '@storybook/addons';

import { IconButton, Toolbar, Separator } from './toolbar';
import Icons from '../icon/icon';
import { Route, Link } from '../router/router';
import { TabButton, TabBar } from '../tabs/tabs';

import Zoom from './zoom';

const defaults = {
  grid: {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='smallGrid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='gray' stroke-width='0.5'/%3E%3C/pattern%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Crect width='100' height='100' fill='url(%23smallGrid)'/%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='gray' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`,
    backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
    backgroundPosition: '-2px -2px',
    mixBlendMode: 'difference',
  },
  background: {
    backgroundColor: 'transparent',
  },
};

class IFrame extends Component {
  shouldComponentUpdate() {
    // this component renders an iframe, which gets updates via post-messages
    return false;
  }

  render() {
    const { id, title, src, allowFullScreen, ...rest } = this.props;
    return (
      <iframe
        id={id}
        title={title}
        src={src}
        allowFullScreen={allowFullScreen}
        {...rest}
        style={{ border: '0 none' }}
      />
    );
  }
}
IFrame.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  src: PropTypes.string.isRequired,
  allowFullScreen: PropTypes.bool.isRequired,
};

const Grid = styled.div(
  {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  defaults.grid
);

const Background = styled.div({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
});

const Frame = styled.div({
  position: 'absolute',
  top: 0,
  left: 0,
  border: '0 none',
  transition: 'transform .2s ease-out, height .2s ease-out, width .2s ease-out',
  transformOrigin: 'top left',
  overflow: 'auto',

  '& > iframe': {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

const FrameWrap = styled.div(({ offset }) => ({
  position: 'absolute',
  overflow: 'auto',
  left: 0,
  right: 0,
  bottom: 0,
  top: offset,
  zIndex: 3,
  height: offset ? `calc(100% - ${offset}px)` : '100%',
  background: 'transparent',
}));

const UnstyledLink = styled(Link)({
  color: 'inherit',
  textDecoration: 'inherit',
  display: 'inline-block',
});

// eslint-disable-next-line react/no-multi-comp
class Preview extends Component {
  state = {
    zoom: 1,
    grid: false,
  };

  shouldComponentUpdate({ location, toolbar, options }, { zoom, grid }) {
    const { props, state } = this;

    return (
      options.isFullscreen !== props.options.isFullscreen ||
      location !== props.location ||
      toolbar !== props.toolbar ||
      zoom !== state.zoom ||
      grid !== state.grid
    );
  }

  componentDidUpdate(prevProps) {
    const { channel, location } = this.props;
    debugger; // eslint-disable-line no-debugger
    if (location && location !== prevProps.location) {
      channel.emit(Events.SET_CURRENT_STORY, { location });
    }
  }

  render() {
    const { id, toolbar = true, location = '/', getElements, actions, options } = this.props;
    const { zoom, grid } = this.state;
    const panels = getElements(types.PANEL);

    const toolbarHeight = toolbar ? 40 : 0;
    const panelList = Object.entries(panels).map(([key, value]) => ({ ...value, key }));
    const tabsList = [{ route: '/components/', title: 'Canvas', key: 'canvas' }].concat(
      getElements(types.TAB)
    );
    const toolList = getElements(types.TOOL);

    return (
      <Fragment>
        {toolbar ? (
          <Toolbar
            key="toolbar"
            left={[
              <TabBar key="tabs" scroll={false}>
                {tabsList.map(t => (
                  <UnstyledLink
                    key={t.key}
                    to={location.replace(/^\/(components|info)\//, t.route)}
                  >
                    <TabButton>{t.title}</TabButton>
                  </UnstyledLink>
                ))}
              </TabBar>,
              <Separator key="1" />,
              <Zoom
                key="zoom"
                current={zoom}
                set={v => this.setState({ zoom: zoom * v })}
                reset={() => this.setState({ zoom: 1 })}
              />,
              <Separator key="2" />,
              <IconButton active={!!grid} key="grid" onClick={() => this.setState({ grid: !grid })}>
                <Icons icon="grid" />
              </IconButton>,
              <Fragment>
                {toolList.map(t => (
                  <Fragment>{t.render()}</Fragment>
                ))}
              </Fragment>,
            ]}
            right={[
              <Separator key="1" />,
              <IconButton key="full" onClick={actions.toggleFullscreen}>
                <Icons icon={options.isFullscreen ? 'cross' : 'expand'} />
              </IconButton>,
              <Separator key="2" />,
              <IconButton key="opener" onClick={() => window.open(`iframe.html?path=${location}`)}>
                <Icons icon="share" />
              </IconButton>,
            ]}
          />
        ) : null}
        <FrameWrap key="frame" offset={toolbarHeight}>
          <Route path="components" startsWith hideOnly>
            <Frame
              style={{
                width: `${100 * zoom}%`,
                height: `${100 * zoom}%`,
                transform: `scale(${1 / zoom})`,
              }}
            >
              <Background id="storybook-preview-background">{grid ? <Grid /> : null}</Background>
              <IFrame
                id="storybook-preview-iframe"
                title={id || 'preview'}
                src={`iframe.html?path=${location}`}
                allowFullScreen
              />
            </Frame>
          </Route>
          {panelList.map(panel => (
            <Route path={panel.route} startsWith hideOnly key={panel.key}>
              {panel.render({ active: true })}
            </Route>
          ))}
        </FrameWrap>
      </Fragment>
    );
  }
}
Preview.propTypes = {
  id: PropTypes.string.isRequired,
  toolbar: PropTypes.bool.isRequired,
  channel: PropTypes.shape({
    on: PropTypes.func,
    emit: PropTypes.func,
    removeListener: PropTypes.func,
  }).isRequired,
  location: PropTypes.string.isRequired,
  getElements: PropTypes.func.isRequired,
  options: PropTypes.shape({
    isFullscreen: PropTypes.bool,
  }).isRequired,
  actions: PropTypes.shape({}).isRequired,
};

export { Preview };