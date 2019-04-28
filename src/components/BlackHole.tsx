import React from 'react';

export class BlackHole extends React.Component {
    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>> | string | number | {} | React.ReactNodeArray | React.ReactPortal | boolean | null | undefined {
        return <div id="blackhole">
            <div className="centerHover"><span>Null Pointer Studios</span></div>
        </div>
    }
}