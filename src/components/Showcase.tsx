import React from "react";

interface ShowcaseProps {

}

interface ShowcaseState {

}

export class Showcase extends React.Component<ShowcaseProps, ShowcaseState> {
    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>> | string | number | {} | React.ReactNodeArray | React.ReactPortal | boolean | null | undefined {
        return <div id="showcase"></div>
    }
}